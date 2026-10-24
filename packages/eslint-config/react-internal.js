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
      // rules-of-hooks and exhaustive-deps. In v6 `configs.recommended` is a
      // flat-config array, whose `.rules` is undefined: spreading it silently
      // enabled nothing. The legacy entry is a plain object with the rules.
      ...pluginReactHooks.configs['recommended-legacy'].rules,
      // Unnecessary with the modern JSX transform.
      'react/react-in-jsx-scope': 'off',
      // Valid React 19 attributes the plugin does not know yet.
      'react/no-unknown-property': ['error', { ignore: ['closedby'] }],
      // NOTE: 'react-hooks/react-compiler' is intentionally NOT enabled. In
      // eslint-plugin-react-hooks v6 that rule id is not registered by the
      // default plugin export, and referencing it fails the entire lint run
      // with a config error rather than producing findings. To opt in, extend
      // pluginReactHooks.configs['recommended-latest'] and verify with
      // `npx eslint --print-config` before committing.
    },
  },
  {
    // Icons are drawn once, in @greese/icons (ADR 0020): add one to that
    // package instead of inlining an `<svg>` or writing a one-off component.
    // A graphic that is not an icon (a chart, a sprite of gradients) says so
    // with an eslint-disable comment and the reason.
    files: ['**/*.tsx'],
    ignores: ['**/*.test.tsx', '**/createIcon.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='svg']",
          message:
            'Do not inline an <svg> icon: add it to packages/icons/src/icons.tsx and import it from @greese/icons (ADR 0020). If this is not an icon, disable this rule here and say why.',
        },
      ],
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
