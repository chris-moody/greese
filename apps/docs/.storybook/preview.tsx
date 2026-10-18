import type { PropsWithChildren } from 'react'
import type { Preview } from '@storybook/react-vite'
import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks'
import { addons } from 'storybook/preview-api'
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events'
import { create } from 'storybook/theming/create'
import { useColorScheme, type ColorScheme } from '@sauce-ui/react'
import { color, font } from '@sauce-ui/tokens'
import '@sauce-ui/react/base.css'
import '@sauce-ui/react/styles.css'

const STORAGE_KEY = 'sauce-storybook-scheme'

/**
 * Applies the toolbar's scheme to the preview document, exactly as an app
 * would (one attribute on <html>). Driven by the globals channel rather than a
 * story decorator, so it also reaches docs pages, including MDX guides that
 * render no stories at all.
 */
const applyScheme = ({ globals }: { globals: { scheme?: ColorScheme } }) => {
  const scheme = globals.scheme ?? 'system'
  const root = document.documentElement
  if (scheme === 'system') root.removeAttribute('data-sauce-scheme')
  else root.setAttribute('data-sauce-scheme', scheme)
}
const channel = addons.getChannel()
channel.on(SET_GLOBALS, applyScheme)
channel.on(GLOBALS_UPDATED, applyScheme)

/** Storybook's docs chrome, built from SauceUI's own tokens per scheme. */
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
    colorPrimary: color.accent[mode],
    colorSecondary: color.accent[mode],
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

const preview: Preview = {
  // A generated docs page (props table, every story) for each component.
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { container: ThemedDocsContainer },
    options: {
      storySort: {
        order: [
          'Guides',
          [
            'Introduction',
            'Getting started',
            'Theming',
            'Responsive props',
            'Accessibility',
            'Animation',
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
