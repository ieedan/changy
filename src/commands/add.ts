import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import z from 'zod';
import { marked, type Token, type Tokens } from 'marked';
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

	// this runs until canceled or the user is happy with the changeset
	while (true) {
		let response: { type: string; change?: string } = await prompt([
			{
				type: 'select',
				message: 'What type of change is this?',
				name: 'type',
				// we have to do this because `CHANGE_TYPES` is readonly
				choices: [...config.changeTypes],
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
		response = { change: change ?? response.change, type: response.type };

		let token = marked.lexer(`- **${response.type}:** ${response.change}`)[0];
		if (token.type != 'list') {
			return; // this should never happen
		}
		let listItem: Tokens.ListItem = token.items[0];

		const changelogContent = fs.readFileSync(changelogPath).toString();

		let ast = marked.lexer(changelogContent);

		let i = 0;

		let changelogOkay = false;

		let found = false;
		while (i < ast.length) {
			let node = ast[i];

			if (node.type == 'heading' && node.depth == 1 && node.text == formattedDate) {
				found = true;
			}

			if (found && node.type == 'heading' && node.depth == 2 && node.text == config.heading) {
				i++;

				if (ast[i].type == 'list') {
					ast[i].raw += '\n' + listItem.raw;

					// show the user their new changeset
					changelogOkay = await confirmChangelog(ast[i - 2], ast[i - 1], ast[i]);

					break;
				}
			}

			i++;
		}

		// we don't modify within the tree instead we create new nodes
		if (!found) {
			let date: Tokens.Heading = {
				type: 'heading',
				raw: `# ${formattedDate}\n\n`,
				depth: 1,
				text: `${formattedDate}`,
				tokens: [],
			};

			let listHeading: Tokens.Heading = {
				type: 'heading',
				raw: `## ${config.heading}\n\n`,
				depth: 2,
				text: `${config.heading}`,
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

			changelogOkay = await confirmChangelog(date, listHeading, list);

			ast.unshift(date, listHeading, list);
		}

		// if accepted write changes and complete
		if (changelogOkay) {
			fs.writeFileSync(changelogPath, astToString(ast));
			break;
		}

		// else we ask again
	}

	success(`Added to ${color.cyan('`CHANGELOG.md`')}.`);
}

async function confirmChangelog(...nodes: Token[]): Promise<boolean> {
	// render markdown in terminal
	const md = await marked(astToString([...nodes]), { renderer: new TerminalRenderer() as any });

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
