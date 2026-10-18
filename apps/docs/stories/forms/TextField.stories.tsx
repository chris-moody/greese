import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextField } from '@greese-ui/react'

const meta = {
  title: 'Forms/TextField',
  component: TextField,
  args: { label: 'Full name', name: 'name', autoComplete: 'name' },
  decorators: [(Story) => <div style={{ maxInlineSize: '24rem' }}>{Story()}</div>],
} satisfies Meta<typeof TextField>
export default meta

type Story = StoryObj<typeof meta>

/** Field + Input in one. */
export const Playground: Story = {}

export const WithDescriptionAndError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    required: true,
    description: "We'll only use it for receipts.",
    error: 'Enter an email address like name@example.com',
  },
}
