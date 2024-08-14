import color from 'chalk';

export const TITLE =
	'\r\n' +
	' ______     __  __     ______     __   __     ______     __  __       \r\n' +
	'/\\  ___\\   /\\ \\_\\ \\   /\\  __ \\   /\\ "-.\\ \\   /\\  ___\\   /\\ \\_\\ \\      \r\n' +
	'\\ \\ \\____  \\ \\  __ \\  \\ \\  __ \\  \\ \\ \\-.  \\  \\ \\ \\__ \\  \\ \\____ \\     \r\n' +
	' \\ \\_____\\  \\ \\_\\ \\_\\  \\ \\_\\ \\_\\  \\ \\_\\\\"\\_\\  \\ \\_____\\  \\/\\_____\\    \r\n' +
	'  \\/_____/   \\/_/\\/_/   \\/_/\\/_/   \\/_/ \\/_/   \\/_____/   \\/_____/    \r\n' +
	'                                                                      \r\n';

export function intro(): void {
	console.info(color.cyan(TITLE));
}

const ERROR = color.bgRedBright(color.black(' ERROR '));
const WARN = color.bgYellow(color.black(' ERROR '));

const PREFIX = '✨';

export function error(msg: unknown): void {
	console.error(`${PREFIX} ${ERROR} ${msg}`);
}

export function warn(msg: unknown): void {
	console.warn(`${PREFIX} ${WARN} ${msg}`);
}

export function success(msg: unknown): void {
	console.info(color.green(`${PREFIX} ${msg}`));
}

// not sure why this is required by enquirer but it is... so we need to disable eslint here
// eslint-disable-next-line func-style
export const cancel = (): boolean => {
	success(`${PREFIX} Canceled...`);
	process.exit(0);
};

export function toMap<T, K, V>(
	arr: T[],
	fn: (item: T, index: number) => [key: K, value: V]
): Map<K, V> {
	const map = new Map();

	for (let i = 0; i < arr.length; i++) {
		const kv = fn(arr[i], i);
		map.set(kv[0], kv[1]);
	}

	return map;
}
