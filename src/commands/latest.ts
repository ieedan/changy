import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import z from 'zod';
import { marked } from 'marked';
import { astToString, error } from '../utils';
import * as settings from '../utils/settings';
import color from 'chalk';

const optionsSchema = z.object({
	cwd: z.string(),
	today: z.boolean(),
});

type Options = z.infer<typeof optionsSchema>;

export const latest = new Command()
	.command('latest')
	.description('Get the latest changelog entry.')
	.option('-c, --cwd <cwd>', 'The current working directory.', process.cwd())
	.option('--today', 'Only returns todays changelog.', false)
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

	let found = false;
	while (i < ast.length) {
		let node = ast[i];

		if (node.type == 'heading' && node.depth == 1) {
			if (options.today && node.text !== formattedDate) {
				i++;
				continue;
			}
			found = true;
		}

		if (found && node.type == 'heading' && node.depth == 2 && node.text == config.heading) {
			i++;

			if (ast[i].type == 'list') {
				console.log(astToString([ast[i - 1], ast[i]]));
				break;
			}
		}

		i++;
	}
}
