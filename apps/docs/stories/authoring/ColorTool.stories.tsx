import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ColorTool, type ComplexColorValue } from '@greese/authoring'
import '@greese/authoring/styles.css'

// Annotated rather than `satisfies`, so a story needn't pass the handlers:
// each story's render supplies them, keeping the paint in state.
const meta: Meta<typeof ColorTool> = {
  title: 'Authoring/ColorTool',
  component: ColorTool,
  args: {
    primary: { type: 'solid', color: '#3b82f6' },
    secondary: { type: 'solid', color: '#111827' },
    primaryLabel: 'Fill',
    secondaryLabel: 'Stroke',
    allowGradient: true,
    allowCurrentColor: false,
  },
}
export default meta

type Story = StoryObj<typeof meta>

/**
 * The paint new shapes get: the fill's swatch over the stroke's. Click one
 * for its picker; the arrows swap them, and the small pair puts back the
 * defaults.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [fill, setFill] = useState<ComplexColorValue>(args.primary)
    const [stroke, setStroke] = useState<ComplexColorValue>(args.secondary)
    return (
      <ColorTool
        {...args}
        primary={fill}
        secondary={stroke}
        onPrimaryChange={setFill}
        onSecondaryChange={setStroke}
        onSwap={() => {
          setFill(stroke)
          setStroke(fill)
        }}
        onReset={() => {
          setFill(args.primary)
          setStroke(args.secondary)
        }}
      />
    )
  },
}

/** An SVG editor's defaults, as Shaper has them: no fill, and a stroke in the text's color. */
export const CurrentColor: Story = {
  args: {
    primary: { type: 'none' },
    secondary: { type: 'solid', color: 'currentColor' },
    allowCurrentColor: true,
    allowGradient: false,
  },
  render: Playground.render,
}
