import { marked } from 'marked';
import { expect, test } from 'vitest';
import { format, stripRawHeading } from '../src/utils/format';
import type { Settings } from '../src/utils/settings';

const SETTINGS: Settings = {
	path: 'CHANGELOG.md',
	timezone: 'UTC',
	changeCategories: ['Added', 'Changed', 'Fixed'],
};

test('Reorders changelogs by date', () => {
	const md = `# 2024.8.5

## Added

- added this

## Changed

- changed this

# 2024.8.6

## Added

- added this

## Changed

- changed this`;

	const ast = marked.lexer(md);

	const newAst = format(SETTINGS, ast);

	expect(stripRawHeading(newAst[0].raw)).toBe('2024.8.6');
});

test('Reorders categories by appearance', () => {
	const md = `# 2024.8.6

## Fixed

- fixed this

## Changed

- changed this

## Added

- added this`;

	const ast = marked.lexer(md);

	const newAst = format(SETTINGS, ast);

	expect(stripRawHeading(newAst[0].raw)).toBe('2024.8.6');
	expect(stripRawHeading(newAst[1].raw)).toBe('Added');
	expect(newAst[2].raw).toBe('- added this');
	expect(newAst[3].raw).toBe('\n\n');
	expect(stripRawHeading(newAst[4].raw)).toBe('Changed');
	expect(newAst[5].raw).toBe('- changed this');
	expect(newAst[6].raw).toBe('\n\n');
	expect(stripRawHeading(newAst[7].raw)).toBe('Fixed');
	expect(newAst[8].raw).toBe('- fixed this');
	expect(newAst[9].raw).toBe('\n');
});

test('Keeps everything the same when correct', () => {
	const md = `# 2024.8.6

## Added

- added this

## Changed

- changed this

## Fixed

- fixed this`;

	const ast = marked.lexer(md);

	const newAst = format(SETTINGS, ast);

	expect(stripRawHeading(newAst[0].raw)).toBe('2024.8.6');
	expect(stripRawHeading(newAst[1].raw)).toBe('Added');
	expect(newAst[2].raw).toBe('- added this');
	expect(newAst[3].raw).toBe('\n\n');
	expect(stripRawHeading(newAst[4].raw)).toBe('Changed');
	expect(newAst[5].raw).toBe('- changed this');
	expect(newAst[6].raw).toBe('\n\n');
	expect(stripRawHeading(newAst[7].raw)).toBe('Fixed');
	expect(newAst[8].raw).toBe('- fixed this');
	expect(newAst[9].raw).toBe('\n');
});
