import path from "node:path";
import { Command } from "commander";
import pkg from "enquirer";
import fs from "fs-extra";
import { marked, type Token } from "marked";
import z from "zod";
const { prompt } = pkg;
import color from "chalk";
import { DateTime } from "luxon";
import TerminalRenderer from "marked-terminal";
import rfdc from "rfdc";
import { cancel, error, intro, success } from "../utils/index.ts";
import { astToString } from "../utils/ast.ts";
import { format } from "../utils/format.ts";
import * as settings from "../utils/settings.ts";
import { getHistory } from "./latest.ts";

const optionsSchema = z.object({
  cwd: z.string(),
});

type Options = z.infer<typeof optionsSchema>;

export const add = new Command()
  .command("add")
  .description("Add a change to the changelog.")
  .argument("[change]", "Change to add to the changelog.")
  .option("-c, --cwd <cwd>", "The current working directory.", Deno.cwd())
  .action(async (change, options) => {
    intro();

    const opts = optionsSchema.parse(options);
    opts.cwd = path.resolve(opts.cwd);

    await run(z.string().optional().parse(change), options);
  });

async function run(
  change: string | undefined,
  options: Options,
): Promise<void> {
  const config = settings.get(options.cwd);

  if (config == null) {
    error(
      `You haven't setup ${color.cyan("changy")} yet. Run ${
        color.cyan("`changy init`")
      } first.`,
    );
    Deno.exit(0);
  }

  const today = DateTime.now().setZone("America/Chicago");

  const formattedDate = `${today.year}.${today.month}.${today.day}`;

  const changelogPath = path.resolve(options.cwd, config.path);

  if (!fs.existsSync(changelogPath)) {
    fs.createFileSync(changelogPath);
  }

  // this runs until canceled or the user is happy with the changelog
  while (true) {
    let response: { category: string; change: string } = await prompt([
      {
        type: "select",
        message: "What type of change is this?",
        name: "category",
        choices: [...config.changeCategories],
        onCancel: cancel,
      },
      {
        type: "text",
        skip: change !== undefined,
        name: "change",
        message: "Enter your change: ",
        onCancel: cancel,
      },
    ]);

    // reassign using options
    response = {
      change: change ?? response.change,
      category: response.category,
    };

    const changelogContent = fs.readFileSync(changelogPath).toString();

    const ast = marked.lexer(changelogContent);

    const newAst = addChange(response, formattedDate, config, ast);

    const newChangelog = getHistory(newAst, { today: true }, config);

    const changelogOkay = await confirmChangelog(...newChangelog);

    // if accepted write changes and complete
    if (changelogOkay) {
      fs.writeFileSync(changelogPath, astToString(newAst));

      success(`Added to ${color.cyan(`\`${config.path}\``)}.`);

      // ask if we want to add more changes
      const response: { yes: boolean } = await prompt({
        type: "confirm",
        message: "Add more changes?",
        name: "yes",
        initial: false,
        onCancel: cancel,
      });

      if (!response.yes) {
        break;
      }
    }

    // else we ask again
  }

  success("All done!");
}

async function confirmChangelog(...nodes: Token[]): Promise<boolean> {
  // render markdown in terminal
  const md = await marked(astToString([...nodes]), {
    // deno-lint-ignore no-explicit-any
    renderer: new TerminalRenderer() as any,
  });

  // add a newline to the top
  console.info("");
  // show changelog to user using `process.stdout.write` to prevent writing extra new line
  Deno.stdout.write(new TextEncoder().encode(md));

  const response: { yes: boolean } = await prompt({
    type: "confirm",
    message: "Is this your desired changelog?",
    name: "yes",
    initial: true,
    onCancel: cancel,
  });

  return response.yes;
}

export function addChange(
  response: { change: string; category: string },
  formattedDate: string,
  config: settings.Settings,
  ast: Token[],
): Token[] {
  let newAst: Token[] = rfdc()(ast).filter((a) => a != undefined);

  // walk the tree

  let i = 0;
  let foundCategory: number | undefined;
  let foundDate: number | undefined;
  let addedChange = false;
  while (i < ast.length) {
    // just a clone we don't want to mutate
    let node = newAst[i];

    if (
      node.type === "heading" &&
      node.depth === 1 &&
      node.text === formattedDate
    ) {
      foundDate = i;
    }

    if (
      foundDate !== undefined &&
      node.type === "heading" &&
      node.depth === 2 &&
      node.text === response.category &&
      !addedChange
    ) {
      foundCategory = i;
      i++;
      node = newAst[i];

      if (newAst[i].type === "list") {
        // trim whitespace from the end of the list
        newAst[i].raw = newAst[i].raw.trim();

        // modify the tree here
        newAst[i].raw += `\n- ${response.change}`;

        addedChange = true;
      }
    }

    // if is next h1 heading or is at end
    if (
      foundDate !== undefined &&
      ((node.type === "heading" && node.depth === 1 && foundDate !== i) ||
        i >= newAst.length - 1)
    ) {
      if (foundCategory === undefined && !addedChange) {
        // make marked generate the correct tokens for us
        const tokens = marked
          .lexer(`## ${response.category}\n\n- ${response.change}\n\n`)
          .filter((a) => a !== undefined);
        // is at end
        if (i >= newAst.length - 1) {
          // put at end
          newAst.push(...tokens);
        } else {
          // put before this heading
          newAst = [...newAst.slice(0, i), ...tokens, ...newAst.slice(i)];
        }

        addedChange = true;
      }
    }

    i++;
  }

  // if the heading was never found
  if (foundCategory === undefined && foundDate === undefined) {
    const tokens = marked.lexer(
      `# ${formattedDate}\n\n## ${response.category}\n\n- ${response.change}\n\n`,
    );

    newAst = [...tokens, ...newAst.filter((a) => a !== undefined)]; // put the new tokens at the beginning
    // even if it is not the correct order it will be sorted when formatted
  }

  // format
  newAst = format(config, newAst);

  return newAst;
}
