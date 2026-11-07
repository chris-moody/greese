import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { LayerTreeItem, makeLayer } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/LayerTreeItem',
  component: LayerTreeItem,
  args: { data: makeLayer({ name: 'Title', layerType: 'layer' }) },
  argTypes: { data: { control: false } },
  decorators: [
    (Story) => (
      <div role="tree" aria-label="Layers" style={{ maxInlineSize: '22rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LayerTreeItem>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A layer's row and its toggles, each named for the layer and pressed while
 * on. In a `LayerTree`, the store keeps what they change.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [hidden, setHidden] = useState(false)
    const [locked, setLocked] = useState(false)
    return (
      <LayerTreeItem
        {...args}
        data={{ ...args.data, hidden, locked }}
        onToggleHidden={() => setHidden((on) => !on)}
        onToggleLocked={() => setLocked((on) => !on)}
      />
    )
  },
}

/** A structural layer (a system-owned one) shows its lock, which can't be undone. */
export const Structural: Story = { args: { structural: true } }
