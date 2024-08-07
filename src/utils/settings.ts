import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import { error, TIME_ZONES } from '.';
import color from 'chalk';

export const SETTINGS_FILE = '.changyrc' as const;

const settingsSchema = z.object({
	timezone: z.enum(TIME_ZONES),
	changeCategories: z.string().trim().min(1).array().min(1),
});

export type Settings = z.infer<typeof settingsSchema>;

export function get(cwd: string): Settings | null {
	const settingsPath = path.resolve(cwd, SETTINGS_FILE);

	if (!fs.existsSync(settingsPath)) {
		return null;
	}

	const settings = JSON.parse(fs.readFileSync(settingsPath).toString());

	try {
		return settingsSchema.parse(settings);
	} catch (err) {
		const validationError = fromError(err);

		error(`${color.green(`'${SETTINGS_FILE}'`)} ${validationError.toString()}`);
		process.exit(0);
	}
}
