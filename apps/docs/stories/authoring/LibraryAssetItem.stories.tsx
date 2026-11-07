import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { emptyLayerState, LibraryAssetItem } from '@greese/authoring'
import { Text } from '@greese/react'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/LibraryAssetItem',
  component: LibraryAssetItem,
  args: {
    data: {
      id: 'logo',
      name: 'Logo',
      category: 'graphic',
      removing: false,
      scene: { layerState: emptyLayerState() },
    },
  },
  argTypes: { data: { control: false } },
  decorators: [
    (Story) => (
      <div role="tree" aria-label="Library" style={{ maxInlineSize: '22rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LibraryAssetItem>
export default meta

type Story = StoryObj<typeof meta>

/** A library row, with an Open button for its subview. */
export const Playground: Story = {
  render: function Playground(args) {
    const [opened, setOpened] = useState(0)
    return (
      <>
        <LibraryAssetItem {...args} onOpen={() => setOpened((n) => n + 1)} />
        <Text variant="caption">Opened {opened} times</Text>
      </>
    )
  },
}
