import js from '@eslint/js';
import ts from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default [
  // Base recommended configuration
  js.configs.recommended,
  ...ts.configs.recommended,

  // Configuration for JavaScript files
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'no-unused-vars': ['warn'],
      'import/order': ['warn', { 'newlines-between': 'always' }],
    },
  },

  // Configuration for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: ts.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': ts.plugin,
      import: importPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn'],
      'import/order': ['warn', { 'newlines-between': 'always' }],
    },
  },

  // Ignore patterns
  {
    ignores: ['node_modules/**', 'dist/**', '.git/**', 'coverage/**'],
  },
];
