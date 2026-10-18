import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppBar, Button, Spacer, Stack, Text } from '@greese-ui/react'

const meta = {
  title: 'Navigation/AppBar',
  component: AppBar,
  parameters: { layout: 'fullscreen' },
  args: {
    children: (
      <>
        <Text weight="semibold">Greese</Text>
        <Spacer />
        <Button size="sm" variant="outline" tone="neutral">
          Sign out
        </Button>
      </>
    ),
  },
  render: (args) => (
    <div>
      <AppBar {...args} />
      <Stack p={5}>
        <Text tone="muted">
          Scroll: the bar sticks and gains a shadow, with no scroll listener.
        </Text>
        <div style={{ blockSize: '120vh' }} />
      </Stack>
    </div>
  ),
} satisfies Meta<typeof AppBar>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Static: Story = { args: { sticky: false, elevateOnScroll: false } }
