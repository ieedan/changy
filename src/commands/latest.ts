import { Argument, Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import z from 'zod';
import { marked, type Token, type Tokens } from 'marked';

const optionsSchema = z.object({
	cwd: z.string(),
	today: z.boolean(),
});

type Options = z.infer<typeof optionsSchema>;

export const latest = new Command()
	.command('latest')
	.description('Get the latest changelog entry')
	.option('-c, --cwd <cwd>', 'The current working directory', process.cwd())
	.option('--today', 'Only returns todays changelog', false)
	.action(async (options) => {
		const opts = optionsSchema.parse(options);
		opts.cwd = path.resolve(opts.cwd);

		await run(options);
	});

async function run(options: Options) {
	const today = new Date();

	const formattedDate = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

	const changelogPath = path.resolve(options.cwd, 'CHANGELOG.md');

	if (!fs.existsSync(changelogPath)) {
		fs.createFileSync(changelogPath);
	}
}
