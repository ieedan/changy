import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import z from 'zod';
import { error, intro, success } from '../utils/index';
import { SETTINGS_FILE } from '../utils/settings';
import * as settings from '../utils/settings';

const optionsSchema = z.object({
	cwd: z.string(),
	timezone: z.string(),
	changeCategories: z.string().array(),
});

type Options = z.infer<typeof optionsSchema>;

export const init = new Command()
	.command('init')
	.description('Initialize changy.')
	.option('-c, --cwd <cwd>', 'The current working directory.', process.cwd())
	.option('-tz, --timezone <timezone>', 'The timezone to date based off of.', 'UTC')
	.option('--change-categories [change-categories...]', 'The types of changes.', [
		'Added',
		'Changed',
		'Fixed',
	])
	.action(async (options) => {
		try {
			intro();

			const opts = optionsSchema.parse(options);
			opts.cwd = path.resolve(opts.cwd);

			await run(options);
		} catch (err) {
			error(err);
		}
	});

async function run(options: Options): Promise<void> {
	if (settings.get(options.cwd) !== null) {
		success('changy already initialized!');
		process.exit(1);
	}

	const changyOptions = {
		timezone: options.timezone,
		changeCategories: options.changeCategories,
	};

	fs.writeFileSync(
		path.resolve(options.cwd, SETTINGS_FILE),
		JSON.stringify(changyOptions, null, 4)
	);

	success('Completed initialization...');
}
