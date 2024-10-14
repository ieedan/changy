import path from "node:path";
import color from "chalk";
import fs from "fs-extra";
import { IANAZone } from "luxon";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { error, warn } from "./index.ts";

export const SETTINGS_FILE = ".changyrc" as const;

export const settingsSchema = z.object({
  path: z.string(),
  timezone: z.string().refine((tz) => IANAZone.isValidZone(tz), {
    message:
      "Invalid IANAZone please refer to https://www.iana.org/time-zones.",
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

  if (settings.path === undefined) {
    // this allows for backwards compatibility with older versions (should be removed with a major)
    warn(
      `Newer versions of ${
        color.cyan("changy")
      } require you to configure a "path" for your changelog file. Please specify it in your .changyrc file.`,
    );
    warn("Using `CHANGELOG.md` for now.");
    settings.path = "CHANGELOG.md";
  }

  try {
    return settingsSchema.parse(settings);
  } catch (err) {
    const validationError = fromError(err);

    error(`${color.green(`'${SETTINGS_FILE}'`)} ${validationError.toString()}`);
    Deno.exit(0);
  }
}
