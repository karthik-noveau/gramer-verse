import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/* `any`, an unused name, a stray console and a left-behind debugger are errors
   rather than warnings: `npm run lint` runs with --max-warnings 0, so a warning
   would fail the build anyway while reading as if it did not. */
export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'spec/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    /* Tooling config that Node reads directly, so CommonJS and its globals. */
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'writable', require: 'readonly', __dirname: 'readonly' },
    },
    /* `require` is the whole point of a .cjs file. */
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      'no-console': 'error',
      'no-debugger': 'error',
    },
  },
);
