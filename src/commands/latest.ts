import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import z from 'zod';
import { marked, type Token } from 'marked';
import { astToString, error } from '../utils';
import * as settings from '../utils/settings';
import color from 'chalk';

const optionsSchema = z.object({
	cwd: z.string(),
	today: z.boolean(),
	withDate: z.boolean(),
});

type Options = z.infer<typeof optionsSchema>;

export const latest = new Command()
	.command('latest')
	.description('Get the latest changelog entry.')
	.option('-c, --cwd <cwd>', 'The current working directory.', process.cwd())
	.option('--today', 'Only returns todays changelog.', false)
	.option('--with-date', 'Includes the xxxx.xx.xx style date in the log.', false)
	.action(async (options) => {
		// don't show intro here only raw output

		const opts = optionsSchema.parse(options);
		opts.cwd = path.resolve(opts.cwd);

		await run(options);
	});

async function run(options: Options) {
	const config = settings.get(options.cwd);

	if (config == null) {
		error(`You haven't setup changy yet run ${color.cyan('`changy init`')} first.`);
		process.exit(0);
	}

	const today = new Date();

	const formattedDate = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

	const changelogPath = path.resolve(options.cwd, 'CHANGELOG.md');

	if (!fs.existsSync(changelogPath)) {
		fs.createFileSync(changelogPath);
	}

	const ast = marked.lexer(fs.readFileSync(changelogPath).toString());

	let i = 0;

	let dateHeading: Token | undefined = undefined;

	const tokens: Token[] = [];

	let found = false;
	while (i < ast.length) {
		const node = ast[i];

		if (node.type == 'heading' && node.depth == 1) {
			if (found) {
				break; // stop at next heading
			}

			if (options.today && node.text !== formattedDate) {
				i++;
				continue;
			}
			dateHeading = node;
			found = true;
			i++;
			continue;
		}

		if (
			found &&
			node.type == 'heading' &&
			node.depth == 2 &&
			config.changeCategories.includes(node.text.replace('##').trim())
		) {
			tokens.push(node);
			i++;

			if (ast[i].type == 'list') {
				tokens.push(ast[i]);
				i++;
				continue;
			}
		}

		// if found we just keep adding the tokens since for whitespace and stuff
		if (found) {
			tokens.push(ast[i]);
		}

		i++;
	}

	if (!dateHeading) {
		return;
	}

	if (options.withDate) {
		console.log(astToString([dateHeading, ...tokens]));
	} else {
		console.log(astToString([dateHeading, ...tokens]));
	}
}
