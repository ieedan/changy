import { Argument, Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import z from 'zod';
import { marked, type Tokens } from 'marked';
import pkg from 'enquirer';
const { prompt } = pkg;
import { DateTime } from 'luxon';
import * as settings from '../utils/settings';
import color from 'chalk';

const optionsSchema = z.object({
	cwd: z.string(),
});

type Options = z.infer<typeof optionsSchema>;

export const add = new Command()
	.command('add')
	.description('Add a change to the CHANGELOG')
	.argument('[change]', 'Change to add to CHANGELOG.md')
	.argument('[type]', 'The type of change')
	.option('-c, --cwd <cwd>', 'The current working directory', process.cwd())
	.action(async (type, change, options) => {
		const opts = optionsSchema.parse(options);
		opts.cwd = path.resolve(opts.cwd);

		await run(z.string().optional().parse(change), options);
	});

async function run(change: string | undefined, options: Options) {
	const config = settings.get(options.cwd);

	if (config == null) {
		console.error(`You haven't setup changy yet run ${color.cyan('`changy init`')} first.`);
		return;
	}

	const today = DateTime.now().setZone('America/Chicago');

	const formattedDate = `${today.year}.${today.month}.${today.day}`;

	const changelogPath = path.resolve(options.cwd, 'CHANGELOG.md');

	if (!fs.existsSync(changelogPath)) {
		fs.createFileSync(changelogPath);
	}

	let response: { type: string; change?: string } = await prompt([
		{
			type: 'select',
			message: 'What type of change is this?',
			name: 'type',
			// we have to do this because `CHANGE_TYPES` is readonly
			choices: [...config.changeTypes],
		},
		{
			type: 'text',
			skip: change !== undefined,
			name: 'change',
			message: 'Enter your change: ',
		},
	]);

	// reassign using options
	response = { change: change ?? response.change, type: type ?? response.type };

	let text = `**${response.type}:** ${response.change}`;
	let raw = `\n- ${text}`;

	const changelogContent = fs.readFileSync(changelogPath).toString();

	let ast = marked.lexer(changelogContent);

	let i = 0;

	let found = false;
	while (i < ast.length) {
		let node = ast[i];

		if (node.type == 'heading' && node.depth == 1 && node.text == formattedDate) {
			found = true;
		}

		if (
			found &&
			node.type == 'heading' &&
			node.depth == 2 &&
			node.text == CHANGE_LIST_HEADING
		) {
			i++;

			if (ast[i].type == 'list') {
				// all we have to do is add to the raw
				ast[i].raw += raw;

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

		let whatsChanged: Tokens.Heading = {
			type: 'heading',
			raw: `## ${CHANGE_LIST_HEADING}\n`,
			depth: 2,
			text: `${CHANGE_LIST_HEADING}`,
			tokens: [],
		};

		let list: Tokens.List = {
			type: 'list',
			raw: `${raw}\n\n`,
			loose: false,
			ordered: false,
			start: '',
			items: [],
		};

		ast.unshift(date, whatsChanged, list);
	}

	fs.writeFileSync(changelogPath, ast.map((node) => node.raw).join(''));
}
