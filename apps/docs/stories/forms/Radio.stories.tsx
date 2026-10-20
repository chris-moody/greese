import type { Meta, StoryObj } from '@storybook/react-vite'
import { Radio, RadioGroup } from '@greese/react'

/** One choice of a RadioGroup: a native radio with its label and description. */
const meta = {
  title: 'Forms/Radio',
  component: Radio,
  args: { value: 'pro', label: 'Pro', description: 'For individuals' },
  decorators: [
    (Story) => (
      <RadioGroup label="Plan" defaultValue="pro">
        <Radio value="free" label="Free" description="For trying things out" />
        <Story />
      </RadioGroup>
    ),
  ],
} satisfies Meta<typeof Radio>
export default meta

type Story = StoryObj<typeof meta>

/** The second radio, selected. */
export const Playground: Story = {}

export const Disabled: Story = {
  args: {
    value: 'team',
    label: 'Team',
    description: 'Not on this account',
    disabled: true,
  },
}
