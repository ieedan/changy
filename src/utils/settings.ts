import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import { error } from '.';
import color from 'chalk';
import { IANAZone } from 'luxon';

export const SETTINGS_FILE = '.changyrc' as const;

export const settingsSchema = z.object({
	timezone: z.string().refine((tz) => IANAZone.isValidZone(tz), {
		message: 'Invalid IANAZone please refer to https://www.iana.org/time-zones.',
	}),
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
