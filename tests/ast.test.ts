import { marked } from 'marked';
import { expect, test } from 'vitest';
import { type ChangelogEntry, astToObject } from '../src/utils/ast';

test('Correct astToObject output single', () => {
	const initial = '# 2024.8.14\n\n## Added\n\n- Added this thing\n';

	const object = astToObject(marked.lexer(initial));

	expect(object[0]).toStrictEqual({
		date: '2024.8.14',
		categories: { Added: ['Added this thing'] },
	} satisfies ChangelogEntry);
});

test('Correct astToObject output multiple', () => {
	const initial =
		'# 2024.8.14\n\n## Added\n\n- Added this thing\n\n# 2024.8.13\n\n## Added\n\n- Added this thing\n';

	const object = astToObject(marked.lexer(initial));

	expect(object).toStrictEqual([
		{
			date: '2024.8.14',
			categories: { Added: ['Added this thing'] },
		},
		{
			date: '2024.8.13',
			categories: { Added: ['Added this thing'] },
		},
	] satisfies ChangelogEntry[]);
});
