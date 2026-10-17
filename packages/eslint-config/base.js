import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import onlyWarn from 'eslint-plugin-only-warn'

/**
 * Shared base config, free of build-tool assumptions.
 *
 * The turbo plugin lives in `./turbo.js` and must be opted into — enabling
 * `turbo/no-undeclared-env-vars` here means every non-turbo consumer gets
 * warnings about a build system it does not use.
 *
 * @type {import("eslint").Linter.Config}
 */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  { plugins: { onlyWarn } },
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
]
