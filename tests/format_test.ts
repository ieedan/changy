import { marked } from "npm:marked";
import { assertEquals } from "jsr:@std/assert";
import { format, stripRawHeading } from "../src/utils/format.ts";
import type { Settings } from "../src/utils/settings.ts";

const SETTINGS: Settings = {
  path: "CHANGELOG.md",
  timezone: "UTC",
  changeCategories: ["Added", "Changed", "Fixed"],
};

Deno.test("Reorders changelogs by date", () => {
  const md = `# 2024.8.5

## Added

- added this

## Changed

- changed this

# 2024.8.6

## Added

- added this

## Changed

- changed this`;

  const ast = marked.lexer(md);

  const newAst = format(SETTINGS, ast);

  assertEquals(stripRawHeading(newAst[0].raw), "2024.8.6");
});

Deno.test("Reorders categories by appearance", () => {
  const md = `# 2024.8.6

## Fixed

- fixed this

## Changed

- changed this

## Added

- added this`;

  const ast = marked.lexer(md);

  const newAst = format(SETTINGS, ast);

  assertEquals(stripRawHeading(newAst[0].raw), "2024.8.6");
  assertEquals(stripRawHeading(newAst[1].raw), "Added");
  assertEquals(newAst[2].raw, "- added this");
  assertEquals(newAst[3].raw, "\n\n");
  assertEquals(stripRawHeading(newAst[4].raw), "Changed");
  assertEquals(newAst[5].raw, "- changed this");
  assertEquals(newAst[6].raw, "\n\n");
  assertEquals(stripRawHeading(newAst[7].raw), "Fixed");
  assertEquals(newAst[8].raw, "- fixed this");
  assertEquals(newAst[9].raw, "\n");
});

Deno.test("Keeps everything the same when correct", () => {
  const md = `# 2024.8.6

## Added

- added this

## Changed

- changed this

## Fixed

- fixed this`;

  const ast = marked.lexer(md);

  const newAst = format(SETTINGS, ast);

  assertEquals(stripRawHeading(newAst[0].raw), "2024.8.6");
  assertEquals(stripRawHeading(newAst[1].raw), "Added");
  assertEquals(newAst[2].raw, "- added this");
  assertEquals(newAst[3].raw, "\n\n");
  assertEquals(stripRawHeading(newAst[4].raw), "Changed");
  assertEquals(newAst[5].raw, "- changed this");
  assertEquals(newAst[6].raw, "\n\n");
  assertEquals(stripRawHeading(newAst[7].raw), "Fixed");
  assertEquals(newAst[8].raw, "- fixed this");
  assertEquals(newAst[9].raw, "\n");
});
