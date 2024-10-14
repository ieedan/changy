import { assertThrows } from "jsr:@std/assert/throws";
import { type Settings, settingsSchema } from "../src/utils/settings.ts";

Deno.test("Catches invalid timezone", () => {
  const settings: Settings = {
    path: "CHANGELOG.md",
    timezone: "Invalid/TimeZone",
    changeCategories: ["Added", "Changed", "Fixed"],
  };

  assertThrows(() => {
    settingsSchema.parse(settings);
  });
});

Deno.test("Catches invalid categories", () => {
  const settings: Settings = {
    path: "CHANGELOG.md",
    timezone: "UTC",
    changeCategories: [],
  };

  assertThrows(() => {
    settingsSchema.parse(settings);
  });
});

Deno.test("Allows valid config", () => {
  const settings: Settings = {
    path: "CHANGELOG.md",
    timezone: "UTC",
    changeCategories: ["Added", "Changed", "Fixed"],
  };

  settingsSchema.parse(settings);
});
