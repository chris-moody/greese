import type { Meta, StoryObj } from '@storybook/react-vite'
import { Break, Heading, Stack, Text } from '@greese-ui/react'

const meta = {
  title: 'Content/Break',
  component: Break,
  args: { above: 'md' },
  argTypes: {
    above: { control: 'select', options: [undefined, 'sm', 'md', 'lg', 'xl'] },
    below: { control: 'select', options: [undefined, 'sm', 'md', 'lg', 'xl'] },
    fallback: { control: 'text' },
  },
  render: (args) => (
    <Heading level={1}>
      Ship faster,
      <Break {...args} />
      on every screen
    </Heading>
  ),
} satisfies Meta<typeof Break>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Breaks from md up. Below it, a non-breaking space joins the lines and keeps
 * "faster, on" together. Resize the viewport to see both.
 */
export const Playground: Story = {}

/** The opposite: a two-line heading on phones, one line from md. */
export const BelowBreakpoint: Story = { args: { above: undefined, below: 'md' } }

/** What renders instead of the break: a separator, a plain space or nothing. */
export const Fallbacks: Story = {
  render: () => (
    <Stack gap={4}>
      <Text size="lg">
        Design
        <Break below="md" fallback=" · " />
        Build
        <Break below="md" fallback=" · " />
        Ship
      </Text>
      <Text size="lg">
        A plain space lets this line wrap where it likes,
        <Break above="lg" fallback=" " />
        and breaks it from lg.
      </Text>
      <Text size="lg">
        Joined
        <Break above="md" fallback={null} />
        Together (no space below md)
      </Text>
    </Stack>
  ),
}
