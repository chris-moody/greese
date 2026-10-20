import turboPlugin from 'eslint-plugin-turbo'

/**
 * Opt-in turbo rules. Spread after a base config:
 *
 *   import { config as base } from '@greese/eslint-config/base'
 *   import { config as turbo } from '@greese/eslint-config/turbo'
 *   export default [...base, ...turbo]
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  {
    plugins: { turbo: turboPlugin },
    rules: { 'turbo/no-undeclared-env-vars': 'warn' },
  },
]
