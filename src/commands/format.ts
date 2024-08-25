import path from 'path';
import color from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import { type Token, type TokensList, marked } from 'marked';
import z from 'zod';
import { error, success } from '../utils';
import { astToString } from '../utils/ast';
import { format as fmt } from '../utils/format';
import * as settings from '../utils/settings';

const optionsSchema = z.object({
	cwd: z.string(),
});

type Options = z.infer<typeof optionsSchema>;

export const format = new Command()
	.command('format')
	.description('Format the changelog file.')
	.option('-c, --cwd <cwd>', 'The current working directory.', process.cwd())
	.action(async (options) => {
		// don't show intro here only raw output

		const opts = optionsSchema.parse(options);
		opts.cwd = path.resolve(opts.cwd);

		await run(options);
	});

async function run(options: Options): Promise<void> {
	const config = settings.get(options.cwd);

	if (config == null) {
		error(`You haven't setup changy yet run ${color.cyan('`changy init`')} first.`);
		process.exit(0);
	}

	const changelogPath = path.resolve(options.cwd, config.path);

	if (!fs.existsSync(changelogPath)) {
		success('changelog file has not yet been created!');
		process.exit(0);
	}

	const changelogContent = fs.readFileSync(changelogPath).toString();

	let ast: TokensList | Token[] = marked.lexer(changelogContent);

	ast = fmt(config, ast);

	fs.writeFileSync(changelogPath, astToString(ast));

	success('All done!');
}
