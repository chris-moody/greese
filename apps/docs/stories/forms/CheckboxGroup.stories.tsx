import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox, CheckboxGroup } from '@greese-ui/react'

const meta = {
  title: 'Forms/CheckboxGroup',
  component: CheckboxGroup,
  args: {
    label: 'Notify me by',
    name: 'notify',
    defaultValue: ['email'],
    direction: { xs: 'column', md: 'row' },
    children: (
      <>
        <Checkbox value="email" label="Email" />
        <Checkbox value="sms" label="SMS" />
        <Checkbox value="push" label="Push notification" />
      </>
    ),
  },
} satisfies Meta<typeof CheckboxGroup>
export default meta

type Story = StoryObj<typeof meta>

/** A labelled set that tracks checked values; stacks on phones. */
export const Playground: Story = {}

export const WithError: Story = {
  args: { error: 'Choose at least one channel.', defaultValue: [] },
}
