import { program, Argument } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import z from 'zod';
import { marked, type Token, type Tokens } from 'marked';
import pkg from 'enquirer';
const { prompt } = pkg;

const CHANGE_LIST_HEADING = "What's Changed";
const CHANGE_TYPES = ['feat', 'fix'] as const;

const changeTypeSchema = z.enum(CHANGE_TYPES).optional();

type ChangeType = z.infer<typeof changeTypeSchema>;

const optionsSchema = z.object({
	cwd: z.string(),
});

type Options = z.infer<typeof optionsSchema>;

const changy = program
	.name('changy')
	.description('Add a change to the CHANGELOG')
	.argument('[change]', 'Change to add to CHANGELOG.md')
	.addArgument(new Argument('[type]', 'The type of change').choices(CHANGE_TYPES))
	.option('-c, --cwd <cwd>', 'The current working directory', process.cwd())
	.action(async (type, change, options) => {
		const opts = optionsSchema.parse(options);
		opts.cwd = path.resolve(opts.cwd);

		await add(changeTypeSchema.parse(type), z.string().optional().parse(change), options);
	});

async function add(type: ChangeType, change: string | undefined, options: Options) {
	const today = new Date();

	const formattedDate = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

	const changelogPath = path.resolve(options.cwd, 'CHANGELOG.md');

	if (!fs.existsSync(changelogPath)) {
		fs.createFileSync(changelogPath);
	}

	let response: { type?: ChangeType; change?: string } = await prompt([
		{
			type: 'select',
			message: 'What type of change is this?',
			skip: type !== undefined,
			name: 'type',
			// we have to do this because `CHANGE_TYPES` is readonly
			choices: [...CHANGE_TYPES],
		},
		{
			type: 'text',
			skip: change !== undefined,
			name: 'change',
			message: 'Enter your change: ',
		},
	]);

	// reassign using options
	response = { change: change ?? response.change, type: type ?? response.type };

	let text = `**${response.type}:** ${response.change}`;
	let raw = `\n- ${text}`;

	const changelogContent = fs.readFileSync(changelogPath).toString();

	let ast = marked.lexer(changelogContent);

	let i = 0;

	let found = false;
	while (i < ast.length) {
		let node = ast[i];

		if (node.type == 'heading' && node.depth == 1 && node.text == formattedDate) {
			found = true;
		}

		if (found && node.type == 'heading' && node.depth == 2 && node.text == CHANGE_LIST_HEADING) {
			i++;

			if (ast[i].type == 'list') {
				// all we have to do is add to the raw
				ast[i].raw += raw;

				break;
			}
		}

		i++;
	}

	// we don't modify within the tree instead we create new nodes
	if (!found) {
		let date: Tokens.Heading = {
			type: 'heading',
			raw: `# ${formattedDate}\n\n`,
			depth: 1,
			text: `${formattedDate}`,
			tokens: [],
		};

		let whatsChanged: Tokens.Heading = {
			type: 'heading',
			raw: `## ${CHANGE_LIST_HEADING}\n`,
			depth: 2,
			text: `${CHANGE_LIST_HEADING}`,
			tokens: [],
		};

		let list: Tokens.List = {
			type: 'list',
			raw: `${raw}\n\n`,
			loose: false,
			ordered: false,
			start: '',
			items: [],
		};

		ast.unshift(date, whatsChanged, list);
	}

	fs.writeFileSync(changelogPath, ast.map((node) => node.raw).join(''));
}

export default changy;
