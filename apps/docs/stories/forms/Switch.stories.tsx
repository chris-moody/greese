import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Switch } from '@greese/react'

const meta = {
  title: 'Forms/Switch',
  component: Switch,
  args: { label: 'Dark mode', description: 'Applies immediately' },
} satisfies Meta<typeof Switch>
export default meta

type Story = StoryObj<typeof meta>

/** A checkbox announced as on/off: for settings that apply at once. */
export const Playground: Story = {}

export const States: Story = {
  render: () => (
    <Stack gap={3}>
      <Switch label="On" defaultChecked />
      <Switch label="Off" />
      <Switch label="Disabled" disabled />
    </Stack>
  ),
}
