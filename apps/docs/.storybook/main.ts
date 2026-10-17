import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'
import { NodePackageImporter } from 'sass-embedded'

const reactSrc = fileURLToPath(new URL('../../../packages/react/src', import.meta.url))

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../stories/**/*.stories.tsx'],
  /**
   * Point @sauce-ui/react at its source (TS + SCSS) instead of dist/, so edits
   * hot-reload with no rebuild. apps/playground covers the built package.
   */
  viteFinal: (vite) => ({
    ...vite,
    resolve: {
      ...vite.resolve,
      alias: [
        {
          find: /^@sauce-ui\/react\/styles\.css$/,
          replacement: `${reactSrc}/styles/index.scss`,
        },
        {
          find: /^@sauce-ui\/react\/base\.css$/,
          replacement: `${reactSrc}/styles/base.scss`,
        },
        { find: /^@sauce-ui\/react$/, replacement: `${reactSrc}/index.ts` },
      ],
    },
    css: {
      ...vite.css,
      preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } },
    },
  }),
}

export default config
