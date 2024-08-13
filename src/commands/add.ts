import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import z from 'zod';
import { marked, type TokensList, type Token, type Tokens } from 'marked';
import pkg from 'enquirer';
const { prompt } = pkg;
import { DateTime } from 'luxon';
import * as settings from '../utils/settings';
import color from 'chalk';
import { astToString, cancel, error, intro, success } from '../utils';
import TerminalRenderer from 'marked-terminal';
import { correctToExpectedNewLines, format, stripRawHeading } from '../utils/format';
import rfdc from 'rfdc';

const optionsSchema = z.object({
	cwd: z.string(),
});

type Options = z.infer<typeof optionsSchema>;

export const add = new Command()
	.command('add')
	.description('Add a change to the changelog.')
	.argument('[change]', 'Change to add to the changelog.')
	.option('-c, --cwd <cwd>', 'The current working directory.', process.cwd())
	.action(async (change, options) => {
		intro();

		const opts = optionsSchema.parse(options);
		opts.cwd = path.resolve(opts.cwd);

		await run(z.string().optional().parse(change), options);
	});

async function run(change: string | undefined, options: Options): Promise<void> {
	const config = settings.get(options.cwd);

	if (config == null) {
		error(`You haven't setup changy yet run ${color.cyan('`changy init`')} first.`);
		process.exit(0);
	}

	const today = DateTime.now().setZone('America/Chicago');

	const formattedDate = `${today.year}.${today.month}.${today.day}`;

	const changelogPath = path.resolve(options.cwd, config.path);

	if (!fs.existsSync(changelogPath)) {
		fs.createFileSync(changelogPath);
	}

	// this runs until canceled or the user is happy with the changelog
	while (true) {
		let response: { category: string; change?: string } = await prompt([
			{
				type: 'select',
				message: 'What type of change is this?',
				name: 'category',
				choices: [...config.changeCategories],
				onCancel: cancel,
			},
			{
				type: 'text',
				skip: change !== undefined,
				name: 'change',
				message: 'Enter your change: ',
				onCancel: cancel,
			},
		]);

		// reassign using options
		response = { change: change ?? response.change, category: response.category };

		const changeHeading: Tokens.Heading = {
			type: 'heading',
			depth: 2,
			raw: `## ${response.category}\n\n`,
			text: `## ${response.category}\n\n`,
			tokens: [],
		};

		const token = marked.lexer(`- ${response.change}`)[0];
		if (token.type != 'list') {
			return; // this should never happen
		}
		const listItem: Tokens.ListItem = token.items[0];

		const changelogContent = fs.readFileSync(changelogPath).toString();

		let ast: TokensList | Token[] = marked.lexer(changelogContent);

		let i = 0;

		let changelogOkay = false;

		let changelogTokens: Token[] = [];

		let foundCategory = false;
		while (i < ast.length) {
			const node = ast[i];

			if (node.type == 'heading' && node.depth == 1 && node.text == formattedDate) {
				changelogTokens.push(node); // add heading to tokens

				i++;
				continue;
			}

			if (
				changelogTokens.length > 0 &&
				node.type == 'heading' &&
				node.depth == 2 &&
				node.raw.trim() == changeHeading.raw.trim()
			) {
				foundCategory = true;
				changelogTokens.push(ast[i]);
				i++;

				if (ast[i].type == 'list') {
					// modify the tree here
					ast[i].raw += `\n${listItem.raw}`;

					changelogTokens.push(ast[i]);
					i++;
					continue;
				}
			}

			if (
				changelogTokens.length > 0 &&
				((ast[i].type == 'heading' && (ast[i] as Tokens.Heading).depth == 1) ||
					i >= ast.length - 1)
			) {
				if (node.type != 'heading') {
					// this way it only adds if we need it
					changelogTokens.push(ast[i]);
					// and it moves past if added because it was already added and does not need to be included in the after slice
					i++;
				}

				if (!foundCategory) {
					changelogTokens = correctToExpectedNewLines(changelogTokens);

					// add the category and change
					changelogTokens.push(changeHeading);
					changelogTokens.push(token);
					// add trailing new lines
					changelogTokens.push({ type: 'space', raw: '\n\n' });
					ast = [...changelogTokens, ...ast.slice(i)];
				}
				break; // break on next heading
			}

			// add whitespace and filler tokens between
			if (changelogTokens.length > 0) {
				changelogTokens.push(ast[i]);
			}

			i++;
		}

		// we don't modify within the tree instead we create new nodes
		if (changelogTokens.length == 0) {
			const date: Tokens.Heading = {
				type: 'heading',
				raw: `# ${formattedDate}\n\n`,
				depth: 1,
				text: `${formattedDate}`,
				tokens: [],
			};

			const list: Tokens.List = {
				type: 'list',
				raw: `${token.raw}\n\n`,
				loose: false,
				ordered: false,
				start: '',
				items: [],
			};

			changelogOkay = await confirmChangelog(...format(config, [date, changeHeading, list]));

			ast.unshift(date, changeHeading, list);
		} else {
			changelogOkay = await confirmChangelog(...format(config, changelogTokens));
		}

		// if accepted write changes and complete
		if (changelogOkay) {
			fs.writeFileSync(changelogPath, astToString(format(config, ast)));

			success(`Added to ${color.cyan(`\`${config.path}\``)}.`);

			// ask if we want to add more changes
			const response: { yes: boolean } = await prompt({
				type: 'confirm',
				message: 'Add more changes?',
				name: 'yes',
				initial: false,
				onCancel: cancel,
			});

			if (!response.yes) {
				break;
			}
		}

		// else we ask again
	}

	success('All done!');
}

async function confirmChangelog(...nodes: Token[]): Promise<boolean> {
	// render markdown in terminal
	const md = await marked(astToString([...nodes]), {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		renderer: new TerminalRenderer() as any,
	});

	// add a newline to the top
	console.info('');
	// show changelog to user using `process.stdout.write` to prevent writing extra new line
	process.stdout.write(md);

	const response: { yes: boolean } = await prompt({
		type: 'confirm',
		message: 'Is this your desired changelog?',
		name: 'yes',
		initial: true,
		onCancel: cancel,
	});

	return response.yes;
}

export function addChange(
	response: { change: string; category: string },
	formattedDate: string,
	config: settings.Settings,
	ast: Token[]
): Token[] {
	let newAst: Token[] = rfdc()(ast);

	// walk the tree

	let i = 0;
	let foundCategory = false;
	let foundDate = false;
	while (i < ast.length) {
		// just a clone we don't want to mutate
		let node = newAst[i];

		if (node.type == 'heading' && node.depth == 1 && node.text == formattedDate) {
			foundDate = true;

			i++;
			continue;
		}

		if (
			foundDate &&
			node.type == 'heading' &&
			node.depth == 2 &&
			stripRawHeading(node.raw) == response.category
		) {
			foundCategory = true;
			i++;
			node = newAst[i];

			if (newAst[i].type == 'list') {
				// trim whitespace from the end of the list
				newAst[i].raw = newAst[i].raw.trim();

				// modify the tree here
				newAst[i].raw += `\n- ${response.change}`;
				i++;
				continue;
			} else {
				error(`Expected list after \`${newAst[i - 1].raw.trim()}\``);
				return ast; // return unmodified ast
			}
		}

		// if is next h1 heading or is at end
		if (foundDate && ((node.type == 'heading' && node.depth == 1) || i >= newAst.length - 1)) {
			if (!foundCategory) {
				// make marked generate the correct tokens for us
				const tokens = marked.lexer(`## ${response.category}\n\n- ${response.change}\n\n`);

				newAst = [...newAst.slice(0, i), ...tokens, ...newAst.slice(i)];
			}
		}

		i++;
	}

	// if the heading was never found
	if (!foundCategory) {
		const tokens = marked.lexer(
			`# ${formattedDate}\n\n## ${response.category}\n\n- ${response.change}\n\n`
		);

		newAst = [...tokens, ...newAst.filter(a => a != undefined)]; // put the new tokens at the beginning
		// even if it is not the correct order it will be sorted when formatted
	}

	// format
	newAst = format(config, newAst);

	return newAst;
}
