// ex. scripts/build_npm.ts
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
	entryPoints: ["./main.ts"],
	outDir: "./npm",
	shims: {
		// see JS docs for overview and more options
		deno: true,
	},
	package: {
		// package.json properties
		name: "changy",
		version: Deno.args[0],
		description: "A simple changelog CLI for user facing changelogs.",
		license: "MIT",
		repository: {
			type: "git",
			url: "git+https://github.com/ieedan/changy",
		},
		bugs: {
			url: "https://github.com/ieedan/changy/issues",
		},
	},
	postBuild() {
		// steps to run after building and before running the tests
		Deno.copyFileSync("LICENSE", "npm/LICENSE");
		Deno.copyFileSync("README.md", "npm/README.md");
	},
});
