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
	heading: z.string().optional(),
	changeTypes: z.string().array().optional(),
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
	.option('--heading <heading>', 'The heading above the change list.')
	.option('--change-types [change-types...]', 'The types of changes.')
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

	let changyOptions: { timezone: Timezone; heading: string; changeTypes: string[] } = {
		timezone: 'UTC',
		heading: "What's Changed?",
		changeTypes: ['fix', 'feat'],
	};

	// if yes skip prompts and apply defaults ⬆️
	if (!options.yes) {
		const response: { timezone?: Timezone; heading?: string; changeTypes?: string[] } =
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
					type: 'text',
					skip: options.heading !== undefined,
					message: 'List Heading: ',
					initial: "What's Changed?",
					name: 'heading',
					onCancel: cancel,
				},
				{
					type: 'list',
					skip: options.changeTypes !== undefined,
					message: 'Change Types: ',
					initial: ['feat', 'fix'],
					name: 'changeTypes',
					onCancel: cancel,
				},
			]);

		changyOptions = {
			timezone: options.timezone ?? response.timezone,
			heading: options.heading ?? response.heading ?? '', // this wont happen
			changeTypes: options.changeTypes ?? response.changeTypes ?? [], // this wont happen
		};
	}

	fs.writeFileSync(
		path.resolve(options.cwd, SETTINGS_FILE),
		JSON.stringify(changyOptions, null, 4)
	);
}
