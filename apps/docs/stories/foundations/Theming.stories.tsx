import type { Meta, StoryObj } from '@storybook/react-vite'
import { createTheme, ThemeProvider } from '@sauce-ui/react'

const brand = createTheme({
  name: 'docs-brand',
  color: { accent: { light: '#7c3aed', dark: '#c4b5fd' } },
  radius: { md: '16px' },
})

const Card = ({ title }: { title: string }) => (
  <div
    style={{
      padding: 'var(--sauce-space-5)',
      background: 'var(--sauce-color-surface)',
      color: 'var(--sauce-color-fg)',
      border: '1px solid var(--sauce-color-border)',
      borderRadius: 'var(--sauce-radius-md)',
    }}
  >
    <strong style={{ color: 'var(--sauce-color-accent)' }}>{title}</strong>
    <p style={{ color: 'var(--sauce-color-fg-muted)' }}>Reads --sauce-* tokens only.</p>
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
        gap: 'var(--sauce-space-4)',
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
