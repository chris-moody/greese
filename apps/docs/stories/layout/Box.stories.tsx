import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from '@greese-ui/react'

const meta = {
  title: 'Layout/Box',
  component: Box,
  args: {
    p: { xs: 3, md: 6 },
    maxW: '32rem',
    mx: 'auto',
    textAlign: { xs: 'start', md: 'center' },
    style: {
      background: 'var(--greese-color-surface)',
      borderRadius: 'var(--greese-radius-lg)',
    },
    children: 'Padding grows at md; text centres at md.',
  },
} satisfies Meta<typeof Box>
export default meta

type Story = StoryObj<typeof meta>

/** Typed, responsive style props. Spacing takes tokens (0-8) or any length. */
export const StyleProps: Story = {}

/** `display` per breakpoint: hidden on phones, a flex row from md. */
export const ResponsiveDisplay: Story = {
  args: {
    display: { xs: 'none', md: 'flex' },
    gap: 3,
    children: 'Visible from md, as a flex row.',
  },
}

/** `asChild` puts Box's styling on your own element. */
export const AsChild: Story = {
  render: () => (
    <Box asChild p={4} style={{ border: '1px dashed var(--greese-color-border-strong)' }}>
      <section aria-label="Example">A real &lt;section&gt; with Box padding.</section>
    </Box>
  ),
}
