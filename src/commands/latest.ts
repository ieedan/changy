import path from 'path';
import color from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import { type Token, marked } from 'marked';
import z from 'zod';
import { error } from '../utils';
import { astToObject, astToString } from '../utils/ast';
import { format } from '../utils/format';
import * as settings from '../utils/settings';

const optionsSchema = z.object({
	cwd: z.string(),
	today: z.boolean(),
	date: z.string().optional(),
	json: z.boolean(),
});

type Options = z.infer<typeof optionsSchema>;

export const latest = new Command()
	.command('latest')
	.description('Get the latest changelog entry.')
	.option('-c, --cwd <cwd>', 'The current working directory.', process.cwd())
	.option('--today', 'Only returns todays changelog.', false)
	.option('--date <date>', 'The specific date to get. (Format as yyyy.MM.dd)')
	.option('--json', 'Output the result in JSON', false)
	.action(async (options) => {
		// don't show intro here only raw output

		const opts = optionsSchema.parse(options);
		opts.cwd = path.resolve(opts.cwd);

		await run(options);
	});

async function run(options: Options): Promise<void> {
	const config = settings.get(options.cwd);

	if (config == null) {
		error(
			`You haven't setup ${color.cyan('changy')} yet. Run ${color.cyan('`changy init`')} first.`
		);
		process.exit(0);
	}

	const changelogPath = path.resolve(options.cwd, config.path);

	if (!fs.existsSync(changelogPath)) {
		fs.createFileSync(changelogPath);
	}

	const ast = marked.lexer(fs.readFileSync(changelogPath).toString());

	const entry = getHistory(ast, options, config);

	if (entry.length != 0) {
		if (options.json) {
			console.info(JSON.stringify(astToObject(entry)[0], null, 2));
		} else {
			console.info(astToString(entry));
		}
	}
}

export function getHistory(
	ast: Token[],
	options: { today: boolean; date?: string },
	config: settings.Settings
): Token[] {
	let latest = true;

	let date = options.date;

	if (!date && options.today) {
		const today = new Date();

		date = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
	}

	// if the date is undefined then we just get the latest
	latest = date == undefined;

	const formattedAst = format(
		config,
		ast.filter((a) => a != undefined)
	);

	let i = 0;
	const entry: Token[] = [];
	let foundDate = false;
	while (i < formattedAst.length) {
		const node = formattedAst[i];

		// if latest then mark first heading if date then match the heading date
		if (
			!foundDate &&
			node.type == 'heading' &&
			node.depth == 1 &&
			(latest || node.text == date)
		) {
			foundDate = true;
			entry.push(node);
			i++;
			continue;
		}

		if (foundDate && node.type == 'heading' && node.depth == 1) {
			break;
		}

		// once found just add the tokens to the end or next heading
		if (foundDate) {
			entry.push(node);
		}

		i++;
	}

	return format(config, entry);
}
