import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, Select } from '@greese-ui/react'

const meta = {
  title: 'Forms/Select',
  component: Select,
  args: { placeholder: 'Choose a country', required: true },
  render: (args) => (
    <Field label="Country" style={{ maxInlineSize: '24rem' }}>
      <Select {...args}>
        <option value="nz">New Zealand</option>
        <option value="au">Australia</option>
        <optgroup label="Americas">
          <option value="ca">Canada</option>
          <option value="us">United States</option>
        </optgroup>
      </Select>
    </Field>
  ),
} satisfies Meta<typeof Select>
export default meta

type Story = StoryObj<typeof meta>

/** Native select: the platform picker on phones. For search, use Combobox. */
export const WithPlaceholder: Story = {}

export const Preselected: Story = { args: { placeholder: undefined, defaultValue: 'au' } }
