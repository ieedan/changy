import path from "node:path";
import color from "npm:chalk";
import { Command } from "npm:commander";
import fs from "npm:fs-extra";
import z from "npm:zod";
import { error, intro, success } from "../utils/index.ts";
import { SETTINGS_FILE } from "../utils/settings.ts";
import * as settings from "../utils/settings.ts";

const optionsSchema = z.object({
  cwd: z.string(),
  path: z.string(),
  timezone: z.string(),
  changeCategories: z.string().array(),
});

type Options = z.infer<typeof optionsSchema>;

export const init = new Command()
  .command("init")
  .description("Initialize changy.")
  .option("-c, --cwd <cwd>", "The current working directory.", Deno.cwd())
  .option(
    "-tz, --timezone <timezone>",
    "The timezone to date based off of.",
    "UTC",
  )
  .option("--path <path>", "The path to the changelog file.", "CHANGELOG.md")
  .option(
    "--change-categories [change-categories...]",
    "The types of changes.",
    [
      "Added",
      "Changed",
      "Fixed",
    ],
  )
  .action((options) => {
    try {
      intro();

      const opts = optionsSchema.parse(options);
      opts.cwd = path.resolve(opts.cwd);

      run(options);
    } catch (err) {
      error(err);
    }
  });

function run(options: Options) {
  if (settings.get(options.cwd) !== null) {
    success(`${color.cyan("changy")} already initialized!`);
    Deno.exit(1);
  }

  const settingsPath = path.resolve(options.cwd, SETTINGS_FILE);

  fs.writeFileSync(
    settingsPath,
    JSON.stringify({ ...options, cwd: undefined }, null, 4),
  );

  success("Completed initialization...");
}
