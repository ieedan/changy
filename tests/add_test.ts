import { marked } from "npm:marked";
import { addChange } from "../src/commands/add.ts";
import type { Settings } from "../src/utils/settings.ts";
import { assertEquals } from "jsr:@std/assert";

const settings: Settings = {
  path: "CHANGELOG.md",
  timezone: "UTC",
  changeCategories: ["Added", "Changed", "Fixed"],
};

Deno.test("Add fresh", () => {
  const initial = "";

  const newAst = addChange(
    { change: "My addition", category: "Added" },
    "2024.8.13",
    settings,
    marked.lexer(initial),
  );

  assertEquals(newAst[0].raw, "# 2024.8.13\n\n");
  assertEquals(newAst[1].raw, "## Added\n\n");
  assertEquals(newAst[2].raw, "- My addition");
  assertEquals(newAst[3].raw, "\n");
});

Deno.test("Add new category", () => {
  const initial = "# 2024.8.13\n\n## Added\n\n- My addition\n";

  const newAst = addChange(
    { change: "My change", category: "Changed" },
    "2024.8.13",
    settings,
    marked.lexer(initial),
  );

  assertEquals(newAst[0].raw, "# 2024.8.13\n\n");
  assertEquals(newAst[1].raw, "## Added\n\n");
  assertEquals(newAst[2].raw, "- My addition\n");
  assertEquals(newAst[3].raw, "\n");
  assertEquals(newAst[4].raw, "## Changed\n\n");
  assertEquals(newAst[5].raw, "- My change");
  assertEquals(newAst[6].raw, "\n");
});

Deno.test("Add new date", () => {
  const initial = "# 2024.8.13\n\n## Added\n\n- My addition\n";

  const newAst = addChange(
    { change: "My addition", category: "Added" },
    "2024.8.14",
    settings,
    marked.lexer(initial),
  );

  assertEquals(newAst[0].raw, "# 2024.8.14\n\n");
  assertEquals(newAst[1].raw, "## Added\n\n");
  assertEquals(newAst[2].raw, "- My addition");
  assertEquals(newAst[3].raw, "\n\n");
  assertEquals(newAst[4].raw, "# 2024.8.13\n\n");
  assertEquals(newAst[5].raw, "## Added\n\n");
  assertEquals(newAst[6].raw, "- My addition\n");
});

Deno.test("Adds correctly with multiple", () => {
  const today = new Date();

  const date = `${today.getFullYear()}.${
    today.getMonth() + 1
  }.${today.getDate()}`;

  const initial =
    `# ${date}\n\n## Added\n\n- My addition\n# 2024.8.13\n\n## Added\n\n- My addition 2\n`;

  const newAst = addChange(
    { change: "New addition", category: "Added" },
    date,
    settings,
    marked.lexer(initial),
  );

  assertEquals(newAst[0].raw, `# ${date}\n\n`);
  assertEquals(newAst[1].raw, "## Added\n\n");
  assertEquals(newAst[2].raw, "- My addition\n- New addition");
  assertEquals(newAst[3].raw, "\n\n");
  assertEquals(newAst[4].raw, "# 2024.8.13\n\n");
  assertEquals(newAst[5].raw, "## Added\n\n");
  assertEquals(newAst[6].raw, "- My addition 2\n");
});

Deno.test("Adds correctly with multiple and multiple today", () => {
  const today = new Date();

  const date = `${today.getFullYear()}.${
    today.getMonth() + 1
  }.${today.getDate()}`;

  const initial =
    `# ${date}\n\n## Added\n\n- My addition\n# 2024.8.13\n\n## Added\n\n- My addition 2\n\n## Changed\n\n- Some change 2\n`;

  const newAst = addChange(
    { change: "New change", category: "Changed" },
    date,
    settings,
    marked.lexer(initial),
  );

  assertEquals(newAst[0].raw, `# ${date}\n\n`);
  assertEquals(newAst[1].raw, "## Added\n\n");
  assertEquals(newAst[2].raw, "- My addition\n");
  assertEquals(newAst[3].raw, "\n");
  assertEquals(newAst[4].raw, "## Changed\n\n");
  assertEquals(newAst[5].raw, "- New change");
  assertEquals(newAst[6].raw, "\n\n");
  assertEquals(newAst[7].raw, "# 2024.8.13\n\n");
  assertEquals(newAst[8].raw, "## Added\n\n");
  assertEquals(newAst[9].raw, "- My addition 2");
  assertEquals(newAst[10].raw, "\n\n");
});
