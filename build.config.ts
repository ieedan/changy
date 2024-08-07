import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: [
		'src/index.ts',
		'src/changy.ts',
		'src/commands/add',
		'src/commands/index',
		'src/commands/latest',
		'src/commands/init',
		'src/utils/index',
		'src/utils/settings',
		'src/utils/format',
	],
	failOnWarn: false,
	declaration: true,
	clean: true,
});
