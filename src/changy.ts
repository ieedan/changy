import color from "chalk";
import { program } from "commander";
import { add, format, init, latest } from "./commands/index.ts";

const changy = program
  .name(color.cyan("changy"))
  .description("Generate user friendly changelogs.")
  .addCommand(init)
  .addCommand(add)
  .addCommand(latest)
  .addCommand(format);

export default changy;
