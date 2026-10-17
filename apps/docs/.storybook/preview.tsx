import { useEffect, type ReactNode } from 'react'
import type { Preview } from '@storybook/react-vite'
import { useColorScheme, type ColorScheme } from '@sauce-ui/react'
import '@sauce-ui/react/base.css'
import '@sauce-ui/react/styles.css'

/** Drives the page scheme from the toolbar, exactly as an app would. */
const PageScheme = ({
  scheme,
  children,
}: {
  scheme: ColorScheme
  children: ReactNode
}) => {
  const { setScheme } = useColorScheme({ storageKey: 'sauce-storybook-scheme' })
  useEffect(() => setScheme(scheme), [scheme, setScheme])
  return children
}

const preview: Preview = {
  parameters: { layout: 'padded' },
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
    (Story, { globals }) => (
      <PageScheme scheme={globals.scheme as ColorScheme}>
        <Story />
      </PageScheme>
    ),
  ],
}

export default preview
