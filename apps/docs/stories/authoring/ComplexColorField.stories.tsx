import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ComplexColorField, type ComplexColorValue } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/ComplexColorField',
  component: ComplexColorField,
  args: {
    label: 'Fill',
    value: { type: 'solid', color: '#db2777' },
    onChange: () => undefined,
    allowNone: true,
    disabled: false,
  },
  argTypes: { value: { control: false }, onChange: { control: false } },
} satisfies Meta<typeof ComplexColorField>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A fill: Solid, Gradient or None. Switching carries the color across, so a
 * solid becomes the gradient's first stop.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [fill, setFill] = useState<ComplexColorValue>({
      type: 'solid',
      color: '#db2777',
    })
    return (
      <div style={{ maxInlineSize: '22rem' }}>
        <ComplexColorField {...args} value={fill} onChange={setFill} />
      </div>
    )
  },
}

/** Opened on a gradient. */
export const Gradient: Story = {
  render: function Gradient(args) {
    const [fill, setFill] = useState<ComplexColorValue>({
      type: 'gradient',
      gradient: {
        type: 'radial',
        cx: 0.5,
        cy: 0.5,
        innerRadius: 0,
        outerCx: 0.5,
        outerCy: 0.5,
        outerRadius: 0.5,
        rotation: 0,
        scaleY: 1,
        stops: [
          { offset: 0, color: '#fde68a' },
          { offset: 1, color: '#b45309' },
        ],
      },
    })
    return (
      <div style={{ maxInlineSize: '22rem' }}>
        <ComplexColorField {...args} value={fill} onChange={setFill} />
      </div>
    )
  },
}
