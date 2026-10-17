import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import svelteConfig from './svelte.config.js';

export default tseslint.config(
  { ignores: ['dist/**', '../public/app/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // Svelte components and rune modules: parse <script lang="ts"> with the TS parser.
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.svelte'],
        svelteConfig,
      },
    },
    rules: {
      // Svelte 5 runes ($state, $derived, ...) are compiler globals.
      'no-undef': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  }
);
