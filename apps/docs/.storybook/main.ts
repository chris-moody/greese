import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'
import remarkGfm from 'remark-gfm'
import { NodePackageImporter } from 'sass-embedded'
import { storySourcePlugin } from './storySource.ts'

const reactSrc = fileURLToPath(new URL('../../../packages/react/src', import.meta.url))
const uiSrc = fileURLToPath(new URL('../../../packages/ui/src', import.meta.url))
const iconsSrc = fileURLToPath(new URL('../../../packages/icons/src', import.meta.url))
const svgSrc = fileURLToPath(new URL('../../../packages/svg/src', import.meta.url))
const authoringSrc = fileURLToPath(
  new URL('../../../packages/authoring/src', import.meta.url)
)

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
        '../../packages/authoring/src/**/*.tsx',
      ],
      tsconfigPath: '../../packages/react/tsconfig.json',
      shouldRemoveUndefinedFromOptional: true,
      // Only props the library declares; React's and the DOM's have their own docs.
      propFilter: (prop) =>
        !prop.parent || !prop.parent.fileName.includes('node_modules'),
    },
  },
  /**
   * Point @greese/react (TS) and @greese/ui's stylesheet (SCSS) at their
   * source instead of dist/, so edits hot-reload with no rebuild.
   * apps/playground covers the built packages.
   */
  viteFinal: (vite) => ({
    ...vite,
    // Stories that keep state show their whole source (storySource.ts).
    plugins: [...(vite.plugins ?? []), storySourcePlugin()],
    resolve: {
      ...vite.resolve,
      alias: [
        {
          find: /^@greese\/react\/styles\.css$/,
          replacement: `${uiSrc}/styles/index.scss`,
        },
        {
          find: /^@greese\/react\/base\.css$/,
          replacement: `${uiSrc}/styles/base.scss`,
        },
        { find: /^@greese\/react$/, replacement: `${reactSrc}/index.ts` },
        { find: /^@greese\/react\/svg$/, replacement: `${reactSrc}/svg/index.ts` },
        { find: /^@greese\/svg$/, replacement: `${svgSrc}/index.ts` },
        // @greese/authoring (ADR 0035): its components, entries and SCSS.
        {
          find: /^@greese\/authoring\/styles\.css$/,
          replacement: `${authoringSrc}/styles/index.scss`,
        },
        {
          find: /^@greese\/authoring\/(core|state)$/,
          replacement: `${authoringSrc}/$1/index.ts`,
        },
        { find: /^@greese\/authoring$/, replacement: `${authoringSrc}/index.ts` },
        // The icons from source too, so their props tables read their TSDoc.
        { find: /^@greese\/icons$/, replacement: `${iconsSrc}/index.ts` },
      ],
    },
    css: {
      ...vite.css,
      preprocessorOptions: { scss: { importers: [new NodePackageImporter()] } },
    },
  }),
}

export default config
