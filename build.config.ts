import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['src/index.ts', 'src/changy.ts'],
	failOnWarn: false,
	declaration: true,
	clean: true,
});
