import type { Meta, StoryObj } from '@storybook/react-vite'
import { NumberStepper } from '@greese/react'

const meta = {
  title: 'Forms/NumberStepper',
  component: NumberStepper,
  // NumberStepper carries its own Field, so it takes the label directly —
  // wrapping it in another one nests two labelled fields.
  args: { label: 'Guests', defaultValue: 2, min: 0, max: 12, step: 1 },
  decorators: [(Story) => <div style={{ maxInlineSize: '12rem' }}>{Story()}</div>],
} satisfies Meta<typeof NumberStepper>
export default meta

type Story = StoryObj<typeof meta>

/** A minus at one end and a plus at the other, with the value between them. */
export const Playground: Story = {}

/** It is a NumberField throughout, so `min`, `max` and `step` behave the same. */
export const Stepped: Story = {
  args: { label: 'Discount', min: 0, max: 100, step: 25, defaultValue: 50 },
}

/** `htmlSize` keeps a short number from taking a whole row. */
export const Measured: Story = {
  args: { label: 'Count', htmlSize: 3, defaultValue: 2 },
}
