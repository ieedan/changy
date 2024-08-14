import { expect, test } from 'vitest';
import { addChange } from '../src/commands/add';
import type { Settings } from '../src/utils/settings';
import { marked } from 'marked';

const settings: Settings = {
	path: 'CHANGELOG.md',
	timezone: 'UTC',
	changeCategories: ['Added', 'Changed', 'Fixed'],
};

test('Add fresh', () => {
	const initial = '';

	const newAst = addChange(
		{ change: 'My addition', category: 'Added' },
		'2024.8.13',
		settings,
		marked.lexer(initial)
	);

	expect(newAst[0].raw).toBe('# 2024.8.13\n\n');
	expect(newAst[1].raw).toBe('## Added\n\n');
	expect(newAst[2].raw).toBe('- My addition');
	expect(newAst[3].raw).toBe('\n');
});

test('Add new category', () => {
	const initial = '# 2024.8.13\n\n## Added\n\n- My addition\n';

	const newAst = addChange(
		{ change: 'My change', category: 'Changed' },
		'2024.8.13',
		settings,
		marked.lexer(initial)
	);

	expect(newAst[0].raw).toBe('# 2024.8.13\n\n');
	expect(newAst[1].raw).toBe('## Added\n\n');
	expect(newAst[2].raw).toBe('- My addition\n');
	expect(newAst[3].raw).toBe('\n');
	expect(newAst[4].raw).toBe('## Changed\n\n');
	expect(newAst[5].raw).toBe('- My change');
	expect(newAst[6].raw).toBe('\n');
});

test('Add new date', () => {
	const initial = '# 2024.8.13\n\n## Added\n\n- My addition\n';

	const newAst = addChange(
		{ change: 'My addition', category: 'Added' },
		'2024.8.14',
		settings,
		marked.lexer(initial)
	);

	expect(newAst[0].raw).toBe('# 2024.8.14\n\n');
	expect(newAst[1].raw).toBe('## Added\n\n');
	expect(newAst[2].raw).toBe('- My addition');
	expect(newAst[3].raw).toBe('\n\n');
	expect(newAst[4].raw).toBe('# 2024.8.13\n\n');
	expect(newAst[5].raw).toBe('## Added\n\n');
	expect(newAst[6].raw).toBe('- My addition\n');
});
