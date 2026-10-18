import type { Meta, StoryObj } from '@storybook/react-vite'
import { NumberField } from '@greese-ui/react'

const meta = {
  title: 'Forms/NumberField',
  component: NumberField,
  args: { label: 'Quantity', defaultValue: 1, min: 1, max: 99 },
  decorators: [(Story) => <div style={{ maxInlineSize: '20rem' }}>{Story()}</div>],
} satisfies Meta<typeof NumberField>
export default meta

type Story = StoryObj<typeof meta>

/** Spinbutton: arrows, Page Up/Down, Home/End. A number pad on phones. */
export const Playground: Story = {}

export const Decimal: Story = {
  args: {
    label: 'Discount',
    description: '0–1 in steps of 0.05',
    defaultValue: 0.1,
    min: 0,
    max: 1,
    step: 0.05,
  },
}
