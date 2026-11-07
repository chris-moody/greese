import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { LayoutBar } from '@greese/authoring'
import '@greese/authoring/styles.css'

const layouts = [
  { id: 'design', name: 'Design' },
  { id: 'split', name: 'Split' },
  { id: 'mine', name: 'My layout' },
]

const meta = {
  title: 'Authoring/LayoutBar',
  component: LayoutBar,
  args: {
    layouts,
    activeLayoutId: 'design',
    canSave: false,
    onSelectLayout: () => undefined,
    onSaveLayout: () => undefined,
  },
  argTypes: { onSelectLayout: { control: false }, onSaveLayout: { control: false } },
} satisfies Meta<typeof LayoutBar>
export default meta

type Story = StoryObj<typeof meta>

/** Choose a panel layout; Save shows for the user's own ("My layout"). */
export const Playground: Story = {
  render: function Playground(args) {
    const [active, setActive] = useState('mine')
    const [saved, setSaved] = useState(0)
    return (
      <LayoutBar
        {...args}
        activeLayoutId={active}
        onSelectLayout={setActive}
        canSave={active === 'mine'}
        onSaveLayout={() => setSaved(saved + 1)}
        saving={false}
      />
    )
  },
}
