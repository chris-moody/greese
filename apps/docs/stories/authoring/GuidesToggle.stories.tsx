import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { GuidesToggle } from '@greese/authoring'

const meta = {
  title: 'Authoring/GuidesToggle',
  component: GuidesToggle,
  args: { showGuides: true, onToggle: () => undefined },
  argTypes: { onToggle: { control: false } },
} satisfies Meta<typeof GuidesToggle>
export default meta

type Story = StoryObj<typeof meta>

/** The guides' toggle: a button named "Guides", pressed while they show. Hiding them keeps them. */
export const Playground: Story = {
  render: function Playground(args) {
    const [on, setOn] = useState<boolean>(args.showGuides)
    return <GuidesToggle {...args} showGuides={on} onToggle={() => setOn(!on)} />
  },
}
