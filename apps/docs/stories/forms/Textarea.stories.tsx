import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Textarea } from '@greese/react'

const meta = {
  title: 'Forms/Textarea',
  component: Textarea,
  args: { placeholder: 'A few words about you', maxRows: 8 },
  render: (args) => (
    <Field
      label="Bio"
      description="Grows as you type (where supported), up to 8 lines."
      style={{ maxInlineSize: '28rem' }}
    >
      <Textarea {...args} />
    </Field>
  ),
} satisfies Meta<typeof Textarea>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** `autosize={false}`: a fixed, manually resizable box. */
export const Fixed: Story = { args: { autosize: false, rows: 4 } }
