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

const optionsSchema = z.object({
	cwd: z.string(),
});

type Options = z.infer<typeof optionsSchema>;

export const add = new Command()
	.command('add')
	.description('Add a change to the CHANGELOG.')
	.argument('[change]', 'Change to add to CHANGELOG.md.')
	.option('-c, --cwd <cwd>', 'The current working directory.', process.cwd())
	.action(async (change, options) => {
		intro();

		const opts = optionsSchema.parse(options);
		opts.cwd = path.resolve(opts.cwd);

		await run(z.string().optional().parse(change), options);
	});

async function run(change: string | undefined, options: Options) {
	const config = settings.get(options.cwd);

	if (config == null) {
		error(`You haven't setup changy yet run ${color.cyan('`changy init`')} first.`);
		process.exit(0);
	}

	const today = DateTime.now().setZone('America/Chicago');

	const formattedDate = `${today.year}.${today.month}.${today.day}`;

	const changelogPath = path.resolve(options.cwd, 'CHANGELOG.md');

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

		let changeHeading: Tokens.Heading = {
			type: 'heading',
			depth: 2,
			raw: `## ${response.category}\n\n`,
			text: `## ${response.category}\n\n`,
			tokens: [],
		};

		let token = marked.lexer(`- ${response.change}`)[0];
		if (token.type != 'list') {
			return; // this should never happen
		}
		let listItem: Tokens.ListItem = token.items[0];

		const changelogContent = fs.readFileSync(changelogPath).toString();

		let ast: TokensList | Token[] = marked.lexer(changelogContent);

		let i = 0;

		let changelogOkay = false;

		let changelogTokens: Token[] = [];

		let foundCategory = false;
		while (i < ast.length) {
			let node = ast[i];

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
					ast[i].raw += '\n' + listItem.raw;

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
					// all of this ensures that we insert with the correct line spacing

					// check last token for trailing new lines
					let previous = changelogTokens[changelogTokens.length - 1];
					let lastIndex = previous.raw.length - 1;
					let newLines = 0;
					while (lastIndex >= 0 && previous.raw[lastIndex] === '\n') {
						newLines++;
						lastIndex--;
					}

					// trims additional whitespace from last token
					if (newLines > 2) {
						// the raw is the only thing that matters in this case anyways
						previous.raw = previous.raw.slice(0, previous.raw.length - (newLines - 2));

						changelogTokens[changelogTokens.length - 1] = previous;
					}

					// based on how many trailing new lines there were we will add or not add our own new lines

					let necessarySpacing = 2 - newLines;

					if (necessarySpacing > 0) {
						changelogTokens.push({
							type: 'space',
							raw: '\n'.repeat(necessarySpacing),
						});
					}

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
			let date: Tokens.Heading = {
				type: 'heading',
				raw: `# ${formattedDate}\n\n`,
				depth: 1,
				text: `${formattedDate}`,
				tokens: [],
			};

			let list: Tokens.List = {
				type: 'list',
				raw: `${token.raw}\n\n`,
				loose: false,
				ordered: false,
				start: '',
				items: [],
			};

			changelogOkay = await confirmChangelog(date, changeHeading, list);

			ast.unshift(date, changeHeading, list);
		} else {
			changelogOkay = await confirmChangelog(...changelogTokens);
		}

		// if accepted write changes and complete
		if (changelogOkay) {
			fs.writeFileSync(changelogPath, astToString(ast));

			success(`Added to ${color.cyan('`CHANGELOG.md`')}.`);

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
	const md = await marked(astToString([...nodes]), { renderer: new TerminalRenderer() as any });

	// add a newline to the top
	console.log('');
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
