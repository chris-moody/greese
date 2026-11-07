import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { GradientEditor, gradientStopsCss, type GradientFill } from '@greese/authoring'
import '@greese/authoring/styles.css'

const sky: GradientFill = {
  type: 'linear',
  x0: 0.5,
  y0: 0,
  x1: 0.5,
  y1: 1,
  stops: [
    { offset: 0, color: '#38bdf8' },
    { offset: 1, color: '#6366f1' },
  ],
}

const meta = {
  title: 'Authoring/GradientEditor',
  component: GradientEditor,
  args: { value: sky, onChange: () => undefined, disabled: false },
  argTypes: { value: { control: false }, onChange: { control: false } },
} satisfies Meta<typeof GradientEditor>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A gradient's type, stops, direction and points. Switch to Radial and its
 * circles take the line's place.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [gradient, setGradient] = useState<GradientFill>(sky)
    return (
      <div style={{ maxInlineSize: '22rem' }}>
        <GradientEditor {...args} value={gradient} onChange={setGradient} />
        <p style={{ fontSize: 'var(--greese-type-caption-font-size)' }}>
          {gradient.type}: {gradientStopsCss(gradient.stops)}
        </p>
      </div>
    )
  },
}
