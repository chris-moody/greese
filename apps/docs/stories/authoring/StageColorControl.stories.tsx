import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { StageColorControl } from '@greese/authoring'

const meta = {
  title: 'Authoring/StageColorControl',
  component: StageColorControl,
  args: { color: '#ffffff', onChange: () => undefined },
  argTypes: { onChange: { control: false } },
} satisfies Meta<typeof StageColorControl>
export default meta

type Story = StoryObj<typeof meta>

/** The stage's background color: a swatch that opens a picker. */
export const Playground: Story = {
  render: function Playground(args) {
    const [color, setColor] = useState('#ffffff')
    return <StageColorControl {...args} color={color} onChange={setColor} />
  },
}
