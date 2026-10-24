import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Header, Link, Stack, Text } from '@greese/react'

const nav = (
  <Stack asChild direction="row" gap={4}>
    <nav aria-label="Main">
      <Link href="#features" tone="neutral">
        Features
      </Link>
      <Link href="#pricing" tone="neutral">
        Pricing
      </Link>
      <Link href="#docs" tone="neutral">
        Docs
      </Link>
    </nav>
  </Stack>
)

const meta = {
  title: 'Navigation/Header',
  component: Header,
  parameters: { layout: 'fullscreen' },
  args: {
    brand: <Text weight="bold">Acme</Text>,
    actions: (
      <Button size="sm" variant="soft">
        Sign in
      </Button>
    ),
    children: nav,
  },
  render: (args) => (
    <div>
      <Header {...args} />
      <Stack p={5} gap={4}>
        <Text tone="muted">
          Scroll: the header sticks, with a shadow once the page moves, and in-page links
          land just below it.
        </Text>
        <div style={{ blockSize: '120vh' }} />
      </Stack>
    </div>
  ),
} satisfies Meta<typeof Header>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Inset from the page's edges, rounded and raised: the page scrolls under it with a gap all round. */
export const Floating: Story = { args: { floating: true } }

/** Scrolls away with the page. */
export const Static: Story = { args: { sticky: false } }

/** The full width of the page, for apps. */
export const FullWidth: Story = { args: { size: 'full' } }
