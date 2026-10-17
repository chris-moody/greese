import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { config as baseConfig } from './base.js'

/**
 * React + TypeScript config for apps and packages in this repo.
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  ...baseConfig,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: { ...globals.browser, ...globals.serviceworker },
    },
  },
  {
    plugins: { 'react-hooks': pluginReactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // Unnecessary with the modern JSX transform.
      'react/react-in-jsx-scope': 'off',
      // NOTE: 'react-hooks/react-compiler' is intentionally NOT enabled. In
      // eslint-plugin-react-hooks v6 that rule id is not registered by the
      // default plugin export, and referencing it fails the entire lint run
      // with a config error rather than producing findings. To opt in, extend
      // pluginReactHooks.configs['recommended-latest'] and verify with
      // `npx eslint --print-config` before committing.
    },
  },
  {
    files: ['**/*.{ts,tsx,cts,mts}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...tseslint.configs.recommended.rules,
      // TypeScript already reports undefined names, and this rule misfires on
      // type-only globals (typescript-eslint recommends turning it off).
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]
