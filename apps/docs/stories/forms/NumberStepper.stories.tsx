import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, NumberStepper } from '@greese/react'

const meta = {
  title: 'Forms/NumberStepper',
  component: NumberStepper,
  args: { defaultValue: 2, min: 0, max: 12, step: 1 },
  render: (args) => (
    <Field label="Guests" style={{ maxInlineSize: '12rem' }}>
      <NumberStepper {...args} />
    </Field>
  ),
} satisfies Meta<typeof NumberStepper>
export default meta

type Story = StoryObj<typeof meta>

/** A minus at one end and a plus at the other, with the value between them. */
export const Playground: Story = {}

/** It is a NumberField throughout, so `min`, `max` and `step` behave the same. */
export const Stepped: Story = { args: { min: 0, max: 100, step: 25, defaultValue: 50 } }
