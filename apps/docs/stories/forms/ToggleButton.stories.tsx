import type { Meta, StoryObj } from '@storybook/react-vite'
import { ButtonGroup, ToggleButton } from '@sauce-ui/react'

const meta = {
  title: 'Forms/ToggleButton',
  component: ToggleButton,
  args: { children: 'Bold', defaultPressed: false },
} satisfies Meta<typeof ToggleButton>
export default meta

type Story = StoryObj<typeof meta>

/** Stays on or off (`aria-pressed`). */
export const Playground: Story = {}

export const Toolbar: Story = {
  render: () => (
    <ButtonGroup aria-label="Text formatting" attached>
      <ToggleButton defaultPressed>Bold</ToggleButton>
      <ToggleButton>Italic</ToggleButton>
      <ToggleButton>Underline</ToggleButton>
    </ButtonGroup>
  ),
}
