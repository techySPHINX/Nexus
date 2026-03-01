import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '**/*.js', '**/*.mjs', '**/*.cjs'],
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended, prettier],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off', // TypeScript handles this
      // Issue #171: Enforce structured NestJS Logger; ban raw console calls in
      // production source files so log entries carry context, levels, and IDs.
      'no-console': 'error',
    },
  },
  {
    // Relax no-console for test / seed / script files where it is acceptable
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'data/**', 'scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
);
