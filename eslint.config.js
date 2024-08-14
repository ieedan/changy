// this is completely overbuilt and will probably be moved out in the future

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
		'no-new-object': 'error',
		'object-shorthand': 'error',
		'prefer-object-spread': 'error',
		'prefer-template': 'error',
		'template-curly-spacing': 'error',
		'default-param-last': 'error',
		'no-new-func': 'error',
		'no-param-reassign': 'error',
		'prefer-arrow-callback': 'error',
		'nonblock-statement-body-position': 'error',
		'no-else-return': 'error',
		'spaced-comment': 'error',
		'func-style': ['error', 'declaration', { allowArrowFunctions: false }],
		'no-console': ['error', { allow: ['info', 'clear', 'error', 'warn'] }],
		'no-nested-ternary': 'error',
		'unicorn/filename-case': ['error', { case: 'kebabCase' }],
		'custom/enforce-upper-case-as-const': 'error',
		'cspell/spellchecker': [
			'error',
			{ autoFix: false, cspell: { words: ['changy', 'changyrc', 'millis', 'Kolkata'] } },
		],
		'@typescript-eslint/array-type': ['error', { default: 'array' }],
		'@typescript-eslint/no-unused-vars': [
			'error',
			{ varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
		],
		'@typescript-eslint/explicit-function-return-type': 'error',
		'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
		'@typescript-eslint/prefer-as-const': 'error',
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: 'default',
				format: ['camelCase'],
				leadingUnderscore: 'allow',
				trailingUnderscore: 'forbid',
			},
			{
				selector: 'typeLike',
				format: ['PascalCase'],
				leadingUnderscore: 'allow',
				trailingUnderscore: 'forbid',
			},
			{
				selector: 'variable',
				modifiers: ['const'],
				format: ['UPPER_CASE', 'camelCase'],
				trailingUnderscore: 'forbid',
				leadingUnderscore: 'allow',
			},
			{
				selector: 'import',
				format: ['camelCase', 'PascalCase'],
				trailingUnderscore: 'forbid',
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
		files: ['**/*.ts'],
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
