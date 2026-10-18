import type { Meta, StoryObj } from '@storybook/react-vite'
import { createTheme, ThemeProvider } from '@greese-ui/react'

const brand = createTheme({
  name: 'docs-brand',
  color: { accent: { light: '#7c3aed', dark: '#c4b5fd' } },
  radius: { md: '16px' },
})

const Card = ({ title }: { title: string }) => (
  <div
    style={{
      padding: 'var(--greese-space-5)',
      background: 'var(--greese-color-surface)',
      color: 'var(--greese-color-fg)',
      border: '1px solid var(--greese-color-border)',
      borderRadius: 'var(--greese-radius-md)',
    }}
  >
    <strong style={{ color: 'var(--greese-color-accent)' }}>{title}</strong>
    <p style={{ color: 'var(--greese-color-fg-muted)' }}>Reads --greese-* tokens only.</p>
  </div>
)

const meta = {
  title: 'Foundations/Theming',
  component: ThemeProvider,
} satisfies Meta<typeof ThemeProvider>
export default meta

/**
 * `createTheme()` builds static CSS once; `ThemeProvider` scopes it with an
 * attribute. Nest providers to force a scheme for one section.
 */
export const NestedThemesAndSchemes: StoryObj<typeof meta> = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: 'var(--greese-space-4)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
      }}
    >
      <Card title="Default theme" />
      <ThemeProvider theme={brand}>
        <Card title="Brand theme" />
      </ThemeProvider>
      <ThemeProvider theme={brand} scheme="dark">
        <Card title="Brand, forced dark" />
      </ThemeProvider>
      <ThemeProvider scheme="light">
        <Card title="Default, forced light" />
      </ThemeProvider>
    </div>
  ),
}
