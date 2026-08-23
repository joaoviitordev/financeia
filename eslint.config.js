import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules', '.husky']),

  /* ---------------------------------------------------------------- *
   * Aplicação (src): lint com informação de tipos                    *
   * ---------------------------------------------------------------- */
  {
    name: 'financeia/app',
    files: ['src/**/*.{ts,tsx}', 'vitest.setup.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      /* --- Proibição de `any` e escapes de tipagem --- */
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true, 'ts-nocheck': true },
      ],

      /* --- Imports de tipo consistentes (casa com verbatimModuleSyntax) --- */
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',

      /* --- Organização de imports --- */
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      /* --- Async / promises --- */
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/return-await': ['error', 'always'],

      /* --- Higiene geral --- */
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'always'],
      curly: ['error', 'all'],
    },
  },

  /* ---------------------------------------------------------------- *
   * Proxy publicado (api/): roda no servidor, não no navegador        *
   * ---------------------------------------------------------------- */
  {
    name: 'financeia/api',
    files: ['api/**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      // Globais do Node, e não do navegador: é justamente o ponto de existir
      // esta pasta. Sem este bloco o `eslint .` passava por cima do arquivo em
      // silêncio, e só o hook de commit acusava, com um aviso enigmático.
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  /* ---------------------------------------------------------------- *
   * Testes                                                            *
   * ---------------------------------------------------------------- */
  {
    name: 'financeia/tests',
    files: ['**/*.{test,spec}.{ts,tsx}', 'vitest.setup.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'no-console': 'off',
    },
  },

  /* ---------------------------------------------------------------- *
   * Arquivos de configuração (Node)                                   *
   * ---------------------------------------------------------------- */
  {
    name: 'financeia/config-files',
    files: ['*.{js,mjs,cjs,ts}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.disableTypeChecked,
    ],
    languageOptions: {
      globals: globals.node,
    },
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  /* Deve ser o último: desliga regras que conflitam com o Prettier */
  prettierConfig,
]);
