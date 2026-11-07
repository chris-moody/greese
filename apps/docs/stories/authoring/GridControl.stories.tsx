import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { GridControl } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/GridControl',
  component: GridControl,
  args: {
    showGrid: false,
    gridInterval: 10,
    onToggleGrid: () => undefined,
    onIntervalChange: () => undefined,
  },
  argTypes: { onToggleGrid: { control: false }, onIntervalChange: { control: false } },
} satisfies Meta<typeof GridControl>
export default meta

type Story = StoryObj<typeof meta>

/** The grid's toggle, pressed while it shows, and its spacing in pixels. */
export const Playground: Story = {
  render: function Playground(args) {
    const [show, setShow] = useState(true)
    const [interval, setInterval] = useState(10)
    return (
      <GridControl
        {...args}
        showGrid={show}
        onToggleGrid={() => setShow(!show)}
        gridInterval={interval}
        onIntervalChange={setInterval}
      />
    )
  },
}
