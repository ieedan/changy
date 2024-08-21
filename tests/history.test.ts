import { expect, test } from 'vitest';
import { getHistory } from '../src/commands/latest';
import { marked } from 'marked';
import type { Settings } from '../src/utils/settings';

const settings: Settings = {
	path: 'CHANGELOG.md',
	timezone: 'UTC',
	changeCategories: ['Added', 'Changed', 'Fixed'],
};

test('Get latest from single', () => {
	const initial = '# 2024.8.13\n\n## Added\n\n- My addition\n';

	const entry = getHistory(marked.lexer(initial), { today: false }, settings);

	expect(entry[0].raw).toBe('# 2024.8.13\n\n');
	expect(entry[1].raw).toBe('## Added\n\n');
	expect(entry[2].raw).toBe('- My addition\n');
});

test('Get latest from multiple', () => {
	const initial =
		'# 2024.8.14\n\n## Added\n\n- My addition\n\n# 2024.8.13\n\n## Added\n\n- My addition\n';

	const entry = getHistory(marked.lexer(initial), { today: false }, settings);

	expect(entry.length).toBe(4); // only want to get the latest entry
	expect(entry[0].raw).toBe('# 2024.8.14\n\n');
	expect(entry[1].raw).toBe('## Added\n\n');
	expect(entry[2].raw).toBe('- My addition');
});

test('Get date from single', () => {
	const initial = '# 2024.8.13\n\n## Added\n\n- My addition\n';

	const entry = getHistory(marked.lexer(initial), { today: false, date: '2024.8.13' }, settings);

	expect(entry.length).toBe(3); // only want to get the latest entry
	expect(entry[0].raw).toBe('# 2024.8.13\n\n');
	expect(entry[1].raw).toBe('## Added\n\n');
	expect(entry[2].raw).toBe('- My addition\n');
});

test('Get date from multiple', () => {
	const initial =
		'# 2024.8.14\n\n## Added\n\n- My addition\n\n# 2024.8.13\n\n## Added\n\n- My addition\n';

	const entry = getHistory(marked.lexer(initial), { today: false, date: '2024.8.13' }, settings);

	expect(entry.length).toBe(3); // only want to get the latest entry
	expect(entry[0].raw).toBe('# 2024.8.13\n\n');
	expect(entry[1].raw).toBe('## Added\n\n');
	expect(entry[2].raw).toBe('- My addition\n');
});

test('Get date from multiple in middle', () => {
	const initial =
		'# 2024.8.14\n\n## Added\n\n- My addition 8.14\n\n# 2024.8.13\n\n## Added\n\n- My addition\n\n# 2024.8.12\n\n## Added\n\n- My addition 8.12\n';

	const entry = getHistory(marked.lexer(initial), { today: false, date: '2024.8.13' }, settings);

	expect(entry.length).toBe(4); // only want to get the latest entry
	expect(entry[0].raw).toBe('# 2024.8.13\n\n');
	expect(entry[1].raw).toBe('## Added\n\n');
	expect(entry[2].raw).toBe('- My addition');
});

test('Get today from single', () => {
	const today = new Date();

	const date = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

	const initial = `# ${date}\n\n## Added\n\n- My addition\n`;

	const entry = getHistory(marked.lexer(initial), { today: true }, settings);

	expect(entry.length).toBe(3); // only want to get the latest entry
	expect(entry[0].raw).toBe(`# ${date}\n\n`);
	expect(entry[1].raw).toBe('## Added\n\n');
	expect(entry[2].raw).toBe('- My addition\n');
});

test('Get today from multiple', () => {
	const today = new Date();

	const date = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

	const initial = `# ${date}\n\n## Added\n\n- My addition\n\n# 2024.8.13\n\n## Added\n\n- My addition\n`;

	const entry = getHistory(marked.lexer(initial), { today: true }, settings);

	expect(entry.length).toBe(4); // only want to get the latest entry
	expect(entry[0].raw).toBe(`# ${date}\n\n`);
	expect(entry[1].raw).toBe('## Added\n\n');
	expect(entry[2].raw).toBe('- My addition');
});

test('Finding nothing for date', () => {
	const initial = `# 2024.8.13\n\n## Added\n\n- My addition\n`;

	const entry = getHistory(marked.lexer(initial), { today: false, date: '2024.8.14' }, settings);

	expect(entry.length).toBe(0); // should be empty
});

test('Finding nothing for latest', () => {
	const initial = ``;

	const entry = getHistory(marked.lexer(initial), { today: false }, settings);

	expect(entry.length).toBe(0); // should be empty
});
