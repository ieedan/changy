import globals from 'globals';
import pluginJs from '@eslint/js';
import * as tseslint from 'typescript-eslint';
import pluginUnicorn from 'eslint-plugin-unicorn';
import cspellPlugin from '@cspell/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

const enforceUpperCaseForAsConstRule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: "Enforce UPPER_CASE for constants marked with 'as const'",
			category: 'Stylistic Issues',
			recommended: false,
		},
		fixable: null,
	},
	create(context) {
		return {
			VariableDeclaration(node) {
				if (node.kind === 'const') {
					node.declarations.forEach((declaration) => {
						if (
							declaration.id.type === 'Identifier' &&
							declaration.init &&
							declaration.init.type === 'TSAsExpression' &&
							declaration.init.typeAnnotation.type === 'TSTypeReference' &&
							declaration.init.typeAnnotation.typeName.name === 'const'
						) {
							const name = declaration.id.name;
							if (name !== name.toUpperCase()) {
								context.report({
									node: declaration.id,
									message:
										"Constant marked with 'as const' should be in UPPER_CASE",
								});
							}
						}
					});
				}
			},
		};
	},
};

const commonConfig = {
	plugins: {
		'@typescript-eslint': tseslint.plugin,
		unicorn: pluginUnicorn,
		cspell: cspellPlugin,
		custom: {
			rules: {
				'enforce-upper-case-as-const': enforceUpperCaseForAsConstRule,
			},
		},
	},
	languageOptions: {
		globals: globals.browser,
	},
	rules: {
		'no-console': 'error',
		'no-nested-ternary': 'error',
		'unicorn/filename-case': ['error', { case: 'kebabCase' }],
		'custom/enforce-upper-case-as-const': 'error',
		'cspell/spellchecker': [
			'error',
			{ autoFix: false, cspell: { words: ['changy', 'changyrc', 'millis', 'Kolkata'] } },
		],
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: ['class', 'interface', 'typeAlias', 'enum'],
				format: ['PascalCase'],
			},
			{
				selector: ['function', 'method', 'property'],
				format: ['camelCase'],
			},
			{
				selector: 'variable',
				modifiers: ['const'],
				format: ['UPPER_CASE', 'camelCase'],
			},
			{
				selector: 'objectLiteralProperty',
				format: null,
			},
		],
	},
};

export default [
	{
		ignores: ['**/dist/*', '**/node_modules/*', 'eslint.config.js'],
	},
	{
		files: ['**/*.{ts}'],
		...commonConfig,
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: ['./tsconfig.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		// Config for JavaScript files
		files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
		...pluginJs.configs.recommended,
		...commonConfig,
	},
	eslintConfigPrettier,
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
];
