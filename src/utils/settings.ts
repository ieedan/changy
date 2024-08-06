import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import { TIME_ZONES } from '.';

export const SETTINGS_FILE = '.changyrc' as const;

const settingsSchema = z.object({
	timezone: z.enum(TIME_ZONES),
	heading: z.string(),
	changeTypes: z.string().array(),
});

export type Settings = z.infer<typeof settingsSchema>;

export function get(cwd: string): Settings | null {
	const settingsPath = path.resolve(cwd, SETTINGS_FILE);

	if (!fs.existsSync(settingsPath)) {
		return null;
	}

	const settings = JSON.parse(fs.readFileSync(settingsPath).toString());

	return settingsSchema.parse(settings);
}
