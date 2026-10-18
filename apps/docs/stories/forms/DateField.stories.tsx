import type { Meta, StoryObj } from '@storybook/react-vite'
import { DateField, Stack } from '@sauce-ui/react'

const meta = {
  title: 'Forms/DateField',
  component: DateField,
  args: { label: 'Due date', min: '2026-01-01' },
  decorators: [(Story) => <div style={{ maxInlineSize: '20rem' }}>{Story()}</div>],
} satisfies Meta<typeof DateField>
export default meta

type Story = StoryObj<typeof meta>

/** The platform's own picker; the value is ISO (2026-10-18). */
export const Playground: Story = {}

export const Types: Story = {
  render: () => (
    <Stack gap={4}>
      <DateField label="Date" />
      <DateField label="Time" type="time" />
      <DateField label="Date and time" type="datetime-local" />
      <DateField label="Month" type="month" />
    </Stack>
  ),
}
