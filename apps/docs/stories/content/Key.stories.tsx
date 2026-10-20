import type { Meta, StoryObj } from '@storybook/react-vite'
import { Key, Text } from '@greese/react'

const meta = {
  title: 'Content/Key',
  component: Key,
  args: { children: 'K' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Key>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Nested: the outer `<kbd>` is the whole shortcut. */
export const Shortcut: Story = {
  render: () => (
    <Text>
      Search with{' '}
      <Key>
        <Key>⌘</Key> + <Key>K</Key>
      </Key>
      , or{' '}
      <Key size="sm">
        <Key size="sm">Ctrl</Key> + <Key size="sm">K</Key>
      </Key>{' '}
      on Windows.
    </Text>
  ),
}
