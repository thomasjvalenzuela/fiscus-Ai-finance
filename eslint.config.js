import js from '@eslint/js'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react:          reactPlugin,
      'react-hooks':  reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window:    'readonly',
        document:  'readonly',
        navigator: 'readonly',
        fetch:     'readonly',
        console:   'readonly',
        URL:       'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Promise:   'readonly',
        Date:      'readonly',
        Math:      'readonly',
        JSON:      'readonly',
        localStorage: 'readonly',
        crypto:    'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',     // not needed in React 17+
      'react/prop-types': 'off',             // TypeScript / runtime validation handles this
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
]
