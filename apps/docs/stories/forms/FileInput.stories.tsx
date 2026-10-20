import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, FileInput } from '@greese/react'

const meta = {
  title: 'Forms/FileInput',
  component: FileInput,
  args: { accept: 'image/*' },
  render: (args) => (
    <Field label="Avatar" description="PNG or JPG, up to 2 MB.">
      <FileInput {...args} />
    </Field>
  ),
} satisfies Meta<typeof FileInput>
export default meta

type Story = StoryObj<typeof meta>

/** The native picker (camera and photos on phones), its button styled. */
export const Playground: Story = {}

export const Multiple: Story = { args: { multiple: true, accept: undefined } }
