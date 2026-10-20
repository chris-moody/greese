import type { PropsWithChildren } from 'react'
import type { Preview } from '@storybook/react-vite'
import {
  Controls,
  DocsContainer,
  Description,
  Heading,
  Primary,
  Stories,
  Subtitle,
  Title,
  useOf,
  type DocsContainerProps,
} from '@storybook/addon-docs/blocks'
import { addons } from 'storybook/preview-api'
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events'
import { SyntaxHighlighter } from 'storybook/internal/components'
import { create } from 'storybook/theming/create'
import { useColorScheme, type ColorScheme } from '@greese/react'
import { color, font } from '@greese/ui'
import '@greese/react/base.css'
import '@greese/react/styles.css'
import { ComponentStyles, hasStyles } from '../stories/_shared/ComponentStyles.tsx'
import { scss } from './scss-grammar.ts'
import { LiveCode } from './LiveCode.tsx'
import { unwrapFragments } from './source.ts'

// Storybook highlights CSS but not SCSS, which the Styling sections show.
SyntaxHighlighter.registerLanguage('scss', scss)

const STORAGE_KEY = 'greese-storybook-scheme'

/**
 * Applies the toolbar's scheme to the preview document, exactly as an app
 * would (one attribute on <html>). Driven by the globals channel rather than a
 * story decorator, so it also reaches docs pages, including MDX guides that
 * render no stories at all.
 */
const applyScheme = ({ globals }: { globals: { scheme?: ColorScheme } }) => {
  const scheme = globals.scheme ?? 'system'
  const root = document.documentElement
  if (scheme === 'system') root.removeAttribute('data-greese-scheme')
  else root.setAttribute('data-greese-scheme', scheme)
}
const channel = addons.getChannel()
channel.on(SET_GLOBALS, applyScheme)
channel.on(GLOBALS_UPDATED, applyScheme)

/** Storybook's docs chrome, built from GreeseUI's own tokens per scheme. */
const docsTheme = (mode: 'light' | 'dark') =>
  create({
    base: mode,
    appBg: color.surface[mode],
    appContentBg: color.canvas[mode],
    appPreviewBg: color.canvas[mode],
    appBorderColor: color.border[mode],
    barBg: color.surface[mode],
    inputBg: color.canvas[mode],
    inputBorder: color.borderStrong[mode],
    textColor: color.fg[mode],
    textMutedColor: color.fgMuted[mode],
    colorPrimary: color.primary[mode],
    colorSecondary: color.primary[mode],
    fontBase: font.body,
    fontCode: font.mono,
  })
const themes = { light: docsTheme('light'), dark: docsTheme('dark') }

/**
 * Docs pages paint their own background from Storybook's docs theme, which is
 * static light by default: dark-mode text then landed on white. Follow the
 * resolved scheme (toolbar choice, or the OS for "system") instead.
 */
const ThemedDocsContainer = (props: PropsWithChildren<DocsContainerProps>) => {
  const { resolvedScheme } = useColorScheme({ storageKey: STORAGE_KEY })
  return <DocsContainer {...props} theme={themes[resolvedScheme]} />
}

/**
 * Storybook's default docs page plus a Styling section for the component:
 * its classes, items, what it's built on, and override examples, all from
 * the style manifest.
 */
/** A component's own name: react-docgen's survives minification; the title is a fallback. */
const nameOf = (component: unknown, title: string): string =>
  (component as { __docgenInfo?: { displayName?: string } } | undefined)?.__docgenInfo
    ?.displayName ?? title.split('/').at(-1)!

const Styling = () => {
  const { csfFile } = useOf('meta')
  const { title = '', component, subcomponents = {} } = csfFile.meta
  const name = nameOf(component, title)
  if (!hasStyles(name)) return null
  return (
    <>
      <Heading>Styling</Heading>
      <ComponentStyles name={name} subcomponents={Object.keys(subcomponents)} />
    </>
  )
}

const DocsPage = () => (
  <>
    <Title />
    <Subtitle />
    <Description />
    <Primary />
    <Controls />
    <LiveCode />
    {/* The first story is already shown above, as the primary example. */}
    <Stories includePrimary={false} />
    <Styling />
  </>
)

const preview: Preview = {
  // A generated docs page (props table, every story) for each component.
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      container: ThemedDocsContainer,
      page: DocsPage,
      // Show code: no <React.Fragment> wrappers from children passed in args.
      source: { transform: (code: string) => unwrapFragments(code) },
    },
    options: {
      storySort: {
        order: [
          'Guides',
          [
            'Introduction',
            'Getting started',
            'Theming',
            'Styling components',
            'Responsive props',
            'Accessibility',
            'Animation',
            'greese.js',
            'Migrating from MUI',
          ],
          'Foundations',
          'Layout',
          'Forms',
          'Content',
          'Overlays',
          'Navigation',
          'Motion',
          'Utilities',
        ],
      },
    },
  },
  globalTypes: {
    scheme: {
      description: 'Colour scheme',
      toolbar: {
        title: 'Scheme',
        icon: 'mirror',
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { scheme: 'system' },
  decorators: [
    // Stories also set it on render, so an isolated story (no manager UI,
    // e.g. visual tests) still gets the scheme from its URL globals.
    (Story, { globals }) => {
      applyScheme({ globals })
      return <Story />
    },
  ],
}

export default preview
