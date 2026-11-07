import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { GradientStopBar, type GradientColorStop } from '@greese/authoring'
import '@greese/authoring/styles.css'

const sunset: GradientColorStop[] = [
  { offset: 0, color: '#f97316' },
  { offset: 0.5, color: '#db2777' },
  { offset: 1, color: '#4c1d95' },
]

const meta = {
  title: 'Authoring/GradientStopBar',
  component: GradientStopBar,
  args: { stops: sunset, onChange: () => undefined, disabled: false },
  argTypes: { stops: { control: false }, onChange: { control: false } },
} satisfies Meta<typeof GradientStopBar>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A gradient's stops on its preview. Click the track to add one; drag a stop
 * or use the arrows to move it; Delete removes it, down to two.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [stops, setStops] = useState(sunset)
    return (
      <div style={{ maxInlineSize: '20rem' }}>
        <GradientStopBar {...args} stops={stops} onChange={setStops} />
      </div>
    )
  },
}
