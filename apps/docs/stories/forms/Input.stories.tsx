import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input, Stack } from '@greese-ui/react'
import { SearchIcon } from '../_shared/fixtures.tsx'

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
