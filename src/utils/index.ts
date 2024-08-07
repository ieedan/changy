import color from 'chalk';
import type { Token } from 'marked';

export const TITLE =
	'\r\n' +
	' ______     __  __     ______     __   __     ______     __  __       \r\n' +
	'/\\  ___\\   /\\ \\_\\ \\   /\\  __ \\   /\\ "-.\\ \\   /\\  ___\\   /\\ \\_\\ \\      \r\n' +
	'\\ \\ \\____  \\ \\  __ \\  \\ \\  __ \\  \\ \\ \\-.  \\  \\ \\ \\__ \\  \\ \\____ \\     \r\n' +
	' \\ \\_____\\  \\ \\_\\ \\_\\  \\ \\_\\ \\_\\  \\ \\_\\\\"\\_\\  \\ \\_____\\  \\/\\_____\\    \r\n' +
	'  \\/_____/   \\/_/\\/_/   \\/_/\\/_/   \\/_/ \\/_/   \\/_____/   \\/_____/    \r\n' +
	'                                                                      \r\n';

export function intro() {
	console.log(color.cyan(TITLE));
}

export const TIME_ZONES = [
	'America/New_York',
	'America/Chicago',
	'America/Denver',
	'America/Los_Angeles',
	'America/Anchorage',
	'America/Honolulu',
	'Europe/London',
	'Europe/Paris',
	'Europe/Berlin',
	'Europe/Moscow',
	'Asia/Tokyo',
	'Asia/Shanghai',
	'Asia/Singapore',
	'Asia/Dubai',
	'Asia/Kolkata',
	'Australia/Sydney',
	'Australia/Perth',
	'America/Sao_Paulo',
	'America/Buenos_Aires',
	'Africa/Cairo',
	'Africa/Johannesburg',
	'Pacific/Auckland',
	'UTC',
] as const;

const ERROR = color.bgRedBright(color.black(' ERROR '));
const WARN = color.bgYellow(color.black(' ERROR '));

export function error(msg: unknown) {
	console.error(`${ERROR} ${msg}`);
}

export function warn(msg: unknown) {
	console.warn(`${WARN} ${msg}`);
}

export function success(msg: unknown) {
	console.log(color.green(`${msg}`));
}

// not sure why this is required by enquirer but it is
export const cancel = () => {
	success('Canceled...');
	process.exit(0);
};

export function astToString(ast: Token[]): string {
	return ast.map((node) => node.raw).join('');
}
