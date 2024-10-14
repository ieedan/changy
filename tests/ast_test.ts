import { marked } from "npm:marked";
import { astToObject, type ChangelogEntry } from "../src/utils/ast.ts";
import { assertEquals } from "jsr:@std/assert";

Deno.test("Correct astToObject output single", () => {
  const initial = "# 2024.8.14\n\n## Added\n\n- Added this thing\n";

  const object = astToObject(marked.lexer(initial));

  assertEquals(
    object[0],
    {
      date: "2024.8.14",
      categories: { Added: ["Added this thing"] },
    } satisfies ChangelogEntry,
  );
});

Deno.test("Correct astToObject output multiple", () => {
  const initial =
    "# 2024.8.14\n\n## Added\n\n- Added this thing\n\n# 2024.8.13\n\n## Added\n\n- Added this thing\n";

  const object = astToObject(marked.lexer(initial));

  assertEquals(
    object,
    [
      {
        date: "2024.8.14",
        categories: { Added: ["Added this thing"] },
      },
      {
        date: "2024.8.13",
        categories: { Added: ["Added this thing"] },
      },
    ] satisfies ChangelogEntry[],
  );
});
