import path from "node:path";
import color from "npm:chalk";
import { Command } from "npm:commander";
import fs from "npm:fs-extra";
import { marked, type Token, type TokensList } from "npm:marked";
import z from "npm:zod";
import { error, success } from "../utils/index.ts";
import { astToString } from "../utils/ast.ts";
import { format as fmt } from "../utils/format.ts";
import * as settings from "../utils/settings.ts";

const optionsSchema = z.object({
  cwd: z.string(),
});

type Options = z.infer<typeof optionsSchema>;

export const format = new Command()
  .command("format")
  .description("Format the changelog file.")
  .option("-c, --cwd <cwd>", "The current working directory.", Deno.cwd())
  .action((options) => {
    // don't show intro here only raw output

    const opts = optionsSchema.parse(options);
    opts.cwd = path.resolve(opts.cwd);

    run(options);
  });

function run(options: Options) {
  const config = settings.get(options.cwd);

  if (config == null) {
    error(
      `You haven't setup ${color.cyan("changy")} yet. Run ${
        color.cyan("`changy init`")
      } first.`,
    );
    Deno.exit(0);
  }

  const changelogPath = path.resolve(options.cwd, config.path);

  if (!fs.existsSync(changelogPath)) {
    success("changelog file has not yet been created!");
    Deno.exit(0);
  }

  const changelogContent = fs.readFileSync(changelogPath).toString();

  let ast: TokensList | Token[] = marked.lexer(changelogContent);

  ast = fmt(config, ast);

  fs.writeFileSync(changelogPath, astToString(ast));

  success("All done!");
}
