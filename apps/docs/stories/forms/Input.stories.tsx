import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input, Stack } from '@greese/react'
import { SearchIcon } from '@greese/icons'

const meta = {
  title: 'Forms/Input',
  component: Input,
  args: {
    'aria-label': 'Search',
    placeholder: 'Search…',
    startAdornment: <SearchIcon />,
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Input>
export default meta

type Story = StoryObj<typeof meta>

/** The bare control. Wrap it in Field (or use TextField) for a visible label. */
export const Playground: Story = {}

export const Adornments: Story = {
  render: () => (
    <Stack gap={3} maxW="20rem">
      <Input
        aria-label="Price"
        inputMode="decimal"
        startAdornment="$"
        endAdornment="NZD"
      />
      <Input aria-label="Website" startAdornment="https://" placeholder="example.com" />
    </Stack>
  ),
}

export const Sizes: Story = {
  render: () => (
    <Stack gap={3} maxW="20rem">
      <Input aria-label="Small" size="sm" placeholder="Small" />
      <Input aria-label="Medium" placeholder="Medium" />
      <Input aria-label="Large" size="lg" placeholder="Large" />
    </Stack>
  ),
}

export const States: Story = {
  render: () => (
    <Stack gap={3} maxW="20rem">
      <Input aria-label="Invalid" invalid defaultValue="not-an-email" />
      <Input aria-label="Disabled" disabled defaultValue="Disabled" />
      <Input aria-label="Read only" readOnly defaultValue="Read only" />
    </Stack>
  ),
}

/**
 * `htmlSize` is how many characters the field holds, so a field with a known
 * span stops taking the whole row. Without it the width is automatic: the
 * field takes what the layout gives it and forces no minimum of its own.
 */
export const Measured: Story = {
  render: () => (
    <Stack direction="row" gap={3} align="center">
      <Input aria-label="Hex" htmlSize={7} defaultValue="#4f46e5" startAdornment={null} />
      <Input aria-label="Degrees" htmlSize={3} defaultValue="180" startAdornment={null} />
      <Input aria-label="Automatic" placeholder="Takes the slack" startAdornment={null} />
    </Stack>
  ),
}
