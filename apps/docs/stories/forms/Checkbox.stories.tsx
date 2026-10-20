import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox, Stack } from '@greese/react'

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  args: { label: 'I accept the terms', description: 'You can withdraw at any time.' },
} satisfies Meta<typeof Checkbox>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const States: Story = {
  render: () => (
    <Stack gap={3}>
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Select all (some selected)" indeterminate />
      <Checkbox label="Invalid" invalid />
      <Checkbox label="Disabled" disabled />
    </Stack>
  ),
}
