import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Input, Select, Textarea } from '@greese-ui/react'

const meta = {
  title: 'Forms/Field',
  component: Field,
  args: {
    label: 'Email',
    description: "We'll only use it for receipts.",
    children: <Input type="email" />,
  },
} satisfies Meta<typeof Field>
export default meta

type Story = StoryObj<typeof meta>

/** Label, description and error wired to the control for assistive tech. */
export const Playground: Story = {}

export const WithError: Story = {
  args: { error: 'Enter an email address like name@example.com', required: true },
}

/** Field works with any control, including your own (see `useFieldControl`). */
export const AnyControl: Story = {
  args: {
    label: 'Notes',
    description: 'Field wraps Select, Textarea and custom controls alike.',
    children: <Textarea placeholder="A few words" />,
  },
}

export const HiddenLabel: Story = {
  args: {
    label: 'Sort by',
    hideLabel: true,
    description: undefined,
    children: (
      <Select defaultValue="new">
        <option value="new">Newest</option>
        <option value="old">Oldest</option>
      </Select>
    ),
  },
}
