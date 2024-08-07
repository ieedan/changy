import { type Token } from 'marked';
import type { Settings } from './settings';
import { toMap } from '.';
import { DateTime } from 'luxon';

export type Options = {
	cwd: string;
};

type Section = {
	heading: Token;
	tokens?: Token[];
	sections?: Section[];
};

/** Formats the provided list of tokens.
 *
 *  1. Re-Orders changelog dates to be chronological from top to bottom
 *  2. Re-Orders changelog categories to be in the order provided in the settings file
 *  3. Corrects spacing
 *
 * @param ast Tokens ready to be formatted
 */
export function format(settings: Settings, ast: Token[]): Token[] {
	// this map contains the categories next to their index value
	// they should be sorted with the lowest index value at the top
	const categoriesMap = toMap(settings.changeCategories, (item, i) => [item, i]);

	const changelogs: Token[][] = [];

	let i = 0;
	let currentChangelog: Section | undefined = undefined;

	let currentSection: Section | undefined = undefined;

	while (i < ast.length) {
		let node = ast[i];

		if (node.type == 'heading' && node.depth == 1) {
			if (currentChangelog != undefined) {
				if (currentSection != undefined) {
					currentSection.tokens = correctToExpectedNewLines(currentSection.tokens ?? []);
					if (currentChangelog.sections) {
						currentChangelog.sections.push(currentSection);
					} else {
						currentChangelog.sections = [currentSection];
					}
				}

				currentSection = undefined;

				// sort the change categories
				currentChangelog.sections?.sort((a, b) => {
					const aHeading = categoriesMap.get(stripRawHeading(a.heading.raw)) ?? 0;
					const bHeading = categoriesMap.get(stripRawHeading(b.heading.raw)) ?? 0;

					return aHeading - bHeading;
				});

				let tokens = sectionToTokens(currentChangelog);
				tokens = correctToExpectedNewLines(tokens);
				// add last changelog to stack
				changelogs.push(tokens);
				currentChangelog = undefined;
			}

			currentChangelog = undefined;
			currentChangelog = { heading: node };
			i++;
			continue;
		}

		if (currentChangelog && node.type == 'heading' && node.depth == 2) {
			if (currentSection != undefined) {
				currentSection.tokens = correctToExpectedNewLines(currentSection.tokens ?? []);
				if (currentChangelog.sections) {
					currentChangelog.sections.push(currentSection);
				} else {
					currentChangelog.sections = [currentSection];
				}
			}

			currentSection = undefined;
			currentSection = { heading: node };
			i++;
			continue;
		}

		if (currentSection) {
			if (currentSection.tokens) {
				currentSection.tokens.push(node);
			} else {
				currentSection.tokens = [node];
			}
		}

		i++;
	}

	// add it at the end in case it didn't get added
	if (currentChangelog != undefined) {
		if (currentSection != undefined) {
			currentSection.tokens = correctToExpectedNewLines(currentSection.tokens ?? []);
			if (currentChangelog.sections) {
				currentChangelog.sections.push(currentSection);
			} else {
				currentChangelog.sections = [currentSection];
			}
		}

		// sort the change categories
		currentChangelog.sections?.sort((a, b) => {
			const aHeading = categoriesMap.get(stripRawHeading(a.heading.raw)) ?? 0;
			const bHeading = categoriesMap.get(stripRawHeading(b.heading.raw)) ?? 0;

			return aHeading - bHeading;
		});

		let tokens = sectionToTokens(currentChangelog);
		tokens = correctToExpectedNewLines(tokens);
		// add last changelog to stack
		changelogs.push(tokens);
	}

	// sort by date
	changelogs.sort((a, b) => compareRawDate(a[0].raw, b[0].raw));

	let newAst: Token[] = [];

	for (const log of changelogs) {
		newAst.push(...log);
	}

	newAst = correctToExpectedNewLines(newAst, 1);

	return newAst;
}

function compareRawDate(a: string, b: string): number {
	return rawToDate(b) - rawToDate(a);
}

function stripRawHeading(str: string): string {
	const stripped = str.replaceAll('#', '').trim();

	return stripped;
}

function rawToDate(str: string): number {
	const stripped = stripRawHeading(str);

	const parsed = DateTime.fromFormat(stripped, 'yyyy.M.d');

	return parsed.toMillis();
}

function sectionToTokens(section: Section): Token[] {
	const tokens = [section.heading];

	if (section.tokens) {
		tokens.push(...section.tokens);
	}

	if (section.sections) {
		for (const sec of section.sections) {
			tokens.push(...sectionToTokens(sec));
		}
	}

	return tokens;
}

/** This will ensure that the end of the tokens is the expected new line count
 *
 * @param tokens
 * @param count Amount of new lines to add at the end `default` 2
 * @returns
 */
export function correctToExpectedNewLines(tokens: Token[], count: number = 2): Token[] {
	let final = tokens[tokens.length - 1];

	// this will trim any additional `space` tokens
	let i = tokens.length - 1;
	while (final.type == 'space') {
		tokens = tokens.slice(0, tokens.length - 1);
		final = tokens[tokens.length - 1];
	}

	// all of this ensures that we insert with the correct line spacing

	// check last token for trailing new lines
	let lastIndex = final.raw.length - 1;
	let newLines = 0;
	while (lastIndex >= 0 && final.raw[lastIndex] === '\n') {
		newLines++;
		lastIndex--;
	}

	// trims additional whitespace from last token
	if (newLines > count) {
		// the raw is the only thing that matters in this case anyways
		final.raw = final.raw.slice(0, final.raw.length - (newLines - count));

		tokens[tokens.length - 1] = final;
	}

	// based on how many trailing new lines there were we will add or not add our own new lines

	let necessarySpacing = count - newLines;

	if (necessarySpacing > 0) {
		tokens.push({
			type: 'space',
			raw: '\n'.repeat(necessarySpacing),
		});
	}

	return tokens;
}
