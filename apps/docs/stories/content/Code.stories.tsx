import type { Meta, StoryObj } from '@storybook/react-vite'
import { Code, Text } from '@sauce-ui/react'

const meta = {
  title: 'Content/Code',
  component: Code,
  args: { children: 'npm install @sauce-ui/react' },
} satisfies Meta<typeof Code>
export default meta

type Story = StoryObj<typeof meta>

export const Inline: Story = {
  render: (args) => (
    <Text>
      Run <Code {...args} /> to get started.
    </Text>
  ),
}

/** A keyboard-scrollable block. Bring your own syntax highlighting. */
export const Block: Story = {
  args: {
    block: true,
    children: `import { Stack } from '@sauce-ui/react'\n\nexport const App = () => <Stack gap={4}>…</Stack>`,
  },
}
