import type { Token, Tokens } from 'marked';

export type ChangelogEntry = {
	date: string;
	categories: {
		[key: string]: string[];
	};
};

export function astToObject(ast: Token[]): ChangelogEntry[] {
	const entries: ChangelogEntry[] = [];

	let i = 0;
	let currentEntry: ChangelogEntry | undefined = undefined;
	while (i < ast.length) {
		let node = ast[i];

		if (node.type == 'heading' && node.depth == 1) {
			if (currentEntry != undefined) {
				// handle current
				entries.push(currentEntry);
				currentEntry = undefined;
			}

			currentEntry = { date: node.text, categories: {} };
			i++;
			continue;
		}

		if (node.type == 'heading' && node.depth == 2 && currentEntry != undefined) {
			const category = node.text;
			i++;
			node = ast[i];
			while (node.type == 'space' && i < ast.length) {
				// skip any spaces
				i++;
				node = ast[i];
			}

			if (node.type == 'list') {
				currentEntry.categories[category] = node.items.map((a: Tokens.ListItem) => a.text);
			}
		}

		i++;
	}

	if (currentEntry != undefined) {
		entries.push(currentEntry);
	}

	return entries;
}

export function astToString(ast: Token[]): string {
	return ast.map((node) => node.raw).join('');
}
