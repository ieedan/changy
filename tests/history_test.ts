import { marked } from "marked";
import { getHistory } from "../src/commands/latest.ts";
import type { Settings } from "../src/utils/settings.ts";
import { assertEquals } from "jsr:@std/assert/equals";

const settings: Settings = {
  path: "CHANGELOG.md",
  timezone: "UTC",
  changeCategories: ["Added", "Changed", "Fixed"],
};

Deno.test("Get latest from single", () => {
  const initial = "# 2024.8.13\n\n## Added\n\n- My addition\n";

  const entry = getHistory(marked.lexer(initial), { today: false }, settings);

  assertEquals(entry[0].raw, "# 2024.8.13\n\n");
  assertEquals(entry[1].raw, "## Added\n\n");
  assertEquals(entry[2].raw, "- My addition\n");
});

Deno.test("Get latest from multiple", () => {
  const initial =
    "# 2024.8.14\n\n## Added\n\n- My addition\n\n# 2024.8.13\n\n## Added\n\n- My addition\n";

  const entry = getHistory(marked.lexer(initial), { today: false }, settings);

  assertEquals(entry.length, 4); // only want to get the latest entry
  assertEquals(entry[0].raw, "# 2024.8.14\n\n");
  assertEquals(entry[1].raw, "## Added\n\n");
  assertEquals(entry[2].raw, "- My addition");
});

Deno.test("Get date from single", () => {
  const initial = "# 2024.8.13\n\n## Added\n\n- My addition\n";

  const entry = getHistory(marked.lexer(initial), {
    today: false,
    date: "2024.8.13",
  }, settings);

  assertEquals(entry.length, 3); // only want to get the latest entry
  assertEquals(entry[0].raw, "# 2024.8.13\n\n");
  assertEquals(entry[1].raw, "## Added\n\n");
  assertEquals(entry[2].raw, "- My addition\n");
});

Deno.test("Get date from multiple", () => {
  const initial =
    "# 2024.8.14\n\n## Added\n\n- My addition\n\n# 2024.8.13\n\n## Added\n\n- My addition\n";

  const entry = getHistory(marked.lexer(initial), {
    today: false,
    date: "2024.8.13",
  }, settings);

  assertEquals(entry.length, 3); // only want to get the latest entry
  assertEquals(entry[0].raw, "# 2024.8.13\n\n");
  assertEquals(entry[1].raw, "## Added\n\n");
  assertEquals(entry[2].raw, "- My addition\n");
});

Deno.test("Get date from multiple in middle", () => {
  const initial =
    "# 2024.8.14\n\n## Added\n\n- My addition 8.14\n\n# 2024.8.13\n\n## Added\n\n- My addition\n\n# 2024.8.12\n\n## Added\n\n- My addition 8.12\n";

  const entry = getHistory(marked.lexer(initial), {
    today: false,
    date: "2024.8.13",
  }, settings);

  assertEquals(entry.length, 4); // only want to get the latest entry
  assertEquals(entry[0].raw, "# 2024.8.13\n\n");
  assertEquals(entry[1].raw, "## Added\n\n");
  assertEquals(entry[2].raw, "- My addition");
});

Deno.test("Get today from single", () => {
  const today = new Date();

  const date = `${today.getFullYear()}.${
    today.getMonth() + 1
  }.${today.getDate()}`;

  const initial = `# ${date}\n\n## Added\n\n- My addition\n`;

  const entry = getHistory(marked.lexer(initial), { today: true }, settings);

  assertEquals(entry.length, 3); // only want to get the latest entry
  assertEquals(entry[0].raw, `# ${date}\n\n`);
  assertEquals(entry[1].raw, "## Added\n\n");
  assertEquals(entry[2].raw, "- My addition\n");
});

Deno.test("Get today from multiple", () => {
  const today = new Date();

  const date = `${today.getFullYear()}.${
    today.getMonth() + 1
  }.${today.getDate()}`;

  const initial =
    `# ${date}\n\n## Added\n\n- My addition\n\n# 2024.8.13\n\n## Added\n\n- My addition\n`;

  const entry = getHistory(marked.lexer(initial), { today: true }, settings);

  assertEquals(entry.length, 4); // only want to get the latest entry
  assertEquals(entry[0].raw, `# ${date}\n\n`);
  assertEquals(entry[1].raw, "## Added\n\n");
  assertEquals(entry[2].raw, "- My addition");
});

Deno.test("Finding nothing for date", () => {
  const initial = "# 2024.8.13\n\n## Added\n\n- My addition\n";

  const entry = getHistory(marked.lexer(initial), {
    today: false,
    date: "2024.8.14",
  }, settings);

  assertEquals(entry.length, 0); // should be empty
});

Deno.test("Finding nothing for latest", () => {
  const initial = "";

  const entry = getHistory(marked.lexer(initial), { today: false }, settings);

  assertEquals(entry.length, 0); // should be empty
});
