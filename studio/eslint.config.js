import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'media-src', 'public', 'qa-output', '.vite-ssg-temp'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    extends: [...tseslint.configs.recommended],
    files: ['vite.config.ts'],
    languageOptions: { ecmaVersion: 2023, globals: globals.node },
  },
  {
    files: ['scripts/**/*.{js,mjs}', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2023, globals: globals.node },
  },
)
