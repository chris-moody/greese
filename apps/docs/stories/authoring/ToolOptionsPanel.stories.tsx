import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { NumberField } from '@greese/react'
import { ToolOptionsPanel } from '@greese/authoring'
import '@greese/authoring/styles.css'

const star = {
  label: 'Star',
  description: 'Drag to draw a star. Hold Shift to keep it upright.',
}

const meta = {
  title: 'Authoring/ToolOptionsPanel',
  component: ToolOptionsPanel,
  args: { tool: star },
  argTypes: { tool: { control: false } },
} satisfies Meta<typeof ToolOptionsPanel>
export default meta

type Story = StoryObj<typeof meta>

/** The active tool's settings, which the editor supplies, under its name and an About button. */
export const Playground: Story = {
  render: function Playground(args) {
    const [points, setPoints] = useState(5)
    return (
      <ToolOptionsPanel {...args}>
        <NumberField
          label="Points"
          min={3}
          max={24}
          value={points}
          onValueChange={(next) => setPoints(next ?? 5)}
        />
      </ToolOptionsPanel>
    )
  },
}

/** A tool with nothing to set says so. */
export const NoOptions: Story = {
  args: { tool: { label: 'Zoom' } },
}
