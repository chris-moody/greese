import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppBar, Button, Spacer, Stack, Text } from '@greese/react'

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
  // A box that scrolls on its own, so the bar has something to stick to
  // wherever the story is shown (a page's canvas only scrolls sideways).
  render: (args) => (
    <div style={{ blockSize: '24rem', overflowY: 'auto' }}>
      <AppBar {...args} />
      <Stack gap={4} p={5}>
        <Text tone="muted">
          Scroll this box: the bar sticks and gains a shadow, with no scroll listener.
        </Text>
        {Array.from({ length: 12 }, (_, i) => (
          <Text key={i}>
            Row {i + 1}. Content scrolls under the bar while it stays at the top.
          </Text>
        ))}
      </Stack>
    </div>
  ),
} satisfies Meta<typeof AppBar>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Static: Story = { args: { sticky: false, elevateOnScroll: false } }
