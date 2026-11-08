import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { StageRulers } from '@greese/authoring'
import { Text } from '@greese/react'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/StageRulers',
  component: StageRulers,
  args: { offsetX: 0, offsetY: 0, scale: 1 },
  argTypes: {
    scale: { control: { type: 'range', min: 0.25, max: 4, step: 0.25 } },
  },
} satisfies Meta<typeof StageRulers>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Rulers in stage units, centered on the stage's origin and following its pan
 * and zoom. Drag from one onto the stage to make a guide; the last one made
 * is reported below.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [guide, setGuide] = useState('none yet')
    return (
      <>
        <div
          style={{
            position: 'relative',
            blockSize: '14rem',
            border: '1px solid var(--greese-color-border)',
          }}
        >
          <StageRulers
            {...args}
            onCreateGuide={(type, position) =>
              setGuide(`${type} at ${Math.round(position)}`)
            }
          />
        </div>
        <Text variant="caption">Last guide: {guide}</Text>
      </>
    )
  },
}

/**
 * `ticks="auto"` spaces the ticks for the zoom: a 24-unit icon at 1600% gets
 * a label every 5 units and a tick per unit, where the fixed spacing (25 and
 * 100 units) would show one tick.
 */
export const AutoTicks: Story = {
  args: { scale: 16, ticks: 'auto', offsetX: -192, offsetY: -80 },
  render: function AutoTicks(args) {
    return (
      <div
        style={{
          position: 'relative',
          blockSize: '14rem',
          border: '1px solid var(--greese-color-border)',
        }}
      >
        <StageRulers {...args} />
      </div>
    )
  },
}
