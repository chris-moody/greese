import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { RulerToggle } from '@greese/authoring'

const meta = {
  title: 'Authoring/RulerToggle',
  component: RulerToggle,
  args: { showRulers: false, onToggle: () => undefined },
  argTypes: { onToggle: { control: false } },
} satisfies Meta<typeof RulerToggle>
export default meta

type Story = StoryObj<typeof meta>

/** The rulers' toggle: a button named "Rulers", pressed while they show. */
export const Playground: Story = {
  render: function Playground(args) {
    const [on, setOn] = useState<boolean>(args.showRulers)
    return <RulerToggle {...args} showRulers={on} onToggle={() => setOn(!on)} />
  },
}
