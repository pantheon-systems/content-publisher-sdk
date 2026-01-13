import js from '@eslint/js';
import globals from 'globals';

// Note: eslint-config-next doesn't fully support ESLint 9 flat config yet
// Using a minimal config until Next.js provides better flat config support
export default [
  js.configs.recommended,
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ['**/*.test.js', '**/*.test.ts', '**/*.test.jsx', '**/*.test.tsx', '**/__tests__/**'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
];
