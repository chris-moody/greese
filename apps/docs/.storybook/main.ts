import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'
import remarkGfm from 'remark-gfm'
import { NodePackageImporter } from 'sass-embedded'

const reactSrc = fileURLToPath(new URL('../../../packages/react/src', import.meta.url))
const iconsSrc = fileURLToPath(new URL('../../../packages/icons/src', import.meta.url))

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  addons: [
    {
      name: '@storybook/addon-docs',
      // GitHub-flavoured Markdown (tables) in the MDX guides.
      options: {
        mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } },
      },
    },
  ],
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.tsx'],
  /**
   * react-docgen-typescript, not the default react-docgen: it follows types
   * across files, so props inherited from BoxStyleProps keep their
   * descriptions and types read as written (`Responsive<SpaceValue>`) rather
   * than "union". scripts/check-prop-docs.mjs uses the same parser.
   */
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      include: [
        '**/*.tsx',
        '../../packages/react/src/**/*.tsx',
        '../../packages/icons/src/**/*.tsx',
      ],
      tsconfigPath: '../../packages/react/tsconfig.json',
      shouldRemoveUndefinedFromOptional: true,
      // Only props the library declares; React's and the DOM's have their own docs.
      propFilter: (prop) =>
        !prop.parent || !prop.parent.fileName.includes('node_modules'),
    },
  },
  /**
   * Point @greese-ui/react at its source (TS + SCSS) instead of dist/, so edits
   * hot-reload with no rebuild. apps/playground covers the built package.
   */
  viteFinal: (vite) => ({
    ...vite,
    resolve: {
      ...vite.resolve,
      alias: [
        {
          find: /^@greese-ui\/react\/styles\.css$/,
          replacement: `${reactSrc}/styles/index.scss`,
        },
        {
          find: /^@greese-ui\/react\/base\.css$/,
          replacement: `${reactSrc}/styles/base.scss`,
        },
        { find: /^@greese-ui\/react$/, replacement: `${reactSrc}/index.ts` },
        // The icons from source too, so their props tables read their TSDoc.
        { find: /^@greese-ui\/icons$/, replacement: `${iconsSrc}/index.ts` },
      ],
    },
    css: {
      ...vite.css,
      preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } },
    },
  }),
}

export default config
