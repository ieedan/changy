import { program } from 'commander';
import { add, init, latest } from './commands';
import color from 'chalk';

const changy = program
	.name(color.cyan('changy'))
	.description('Generate user friendly changelogs.')
	.addCommand(init)
	.addCommand(add)
	.addCommand(latest);

export default changy;
