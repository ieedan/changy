import { Command, Option } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import z from 'zod';
import { cancel, error, intro, success, TIME_ZONES } from '../utils/index';
import { SETTINGS_FILE } from '../utils/settings';
import Enquirer from 'enquirer';
const enquirer = new Enquirer();
import * as settings from '../utils/settings';

const optionsSchema = z.object({
	cwd: z.string(),
	timezone: z.enum(TIME_ZONES).optional(),
	changeCategories: z.string().array().optional(),
	yes: z.boolean().optional(),
});

type Options = z.infer<typeof optionsSchema>;

type Timezone = z.infer<typeof optionsSchema>['timezone'];

export const init = new Command()
	.command('init')
	.description('Initialize changy.')
	.option('-c, --cwd <cwd>', 'The current working directory.', process.cwd())
	.addOption(
		new Option('-tz, --timezone <timezone>', 'The timezone to date based off of.').choices(
			TIME_ZONES
		)
	)
	.option('--change-categories [change-categories...]', 'The types of changes.')
	.option('-y, --yes', 'Skip all prompts and apply defaults.')
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

async function run(options: Options) {
	if (settings.get(options.cwd) !== null) {
		success('changy already initialized!');
		process.exit(1);
	}

	let changyOptions: { timezone: Timezone; changeCategories: string[] } = {
		timezone: 'UTC',
		changeCategories: ['Added', 'Changed', 'Fixed'],
	};

	// if yes skip prompts and apply defaults ⬆️
	if (!options.yes) {
		const response: { timezone?: Timezone; changeCategories?: string[] } =
			await enquirer.prompt([
				{
					type: 'autocomplete',
					maxChoices: 5,
					skip: options.timezone !== undefined,
					choices: [...TIME_ZONES],
					message: 'What timezone should we use?',
					name: 'timezone',
					onCancel: cancel,
				},
				{
					type: 'list',
					skip: options.changeCategories !== undefined,
					message: 'Change Categories: ',
					initial: ['Added', 'Changed', 'Fixed'],
					name: 'changeCategories',
					validate: (value) => {
						if (value.length == 0) {
							return false;
						}

						for (const item of value) {
							if (item.trim().length == 0) {
								return false;
							}
						}

						return true;
					},
					onCancel: cancel,
				},
			]);

		changyOptions = {
			timezone: options.timezone ?? response.timezone,
			changeCategories: options.changeCategories ?? response.changeCategories ?? [], // this wont happen
		};
	}

	fs.writeFileSync(
		path.resolve(options.cwd, SETTINGS_FILE),
		JSON.stringify(changyOptions, null, 4)
	);

	success('Completed initialization...');
}
