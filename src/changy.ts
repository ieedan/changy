import { program } from 'commander';
import { add, init, latest } from './commands';

const changy = program
	.name('changy')
	.description('Generate user friendly changelogs.')
	.addCommand(init)
	.addCommand(add)
	.addCommand(latest);

export default changy;
