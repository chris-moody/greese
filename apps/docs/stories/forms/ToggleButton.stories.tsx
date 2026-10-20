import type { Meta, StoryObj } from '@storybook/react-vite'
import { ButtonGroup, ToggleButton } from '@greese/react'

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

/** Pressed shows the button's tone; the default `neutral` presses to primary. */
export const Toned: Story = {
  render: () => (
    <ButtonGroup aria-label="Favourites" attached>
      <ToggleButton tone="secondary" defaultPressed>
        Starred
      </ToggleButton>
      <ToggleButton tone="secondary">Pinned</ToggleButton>
    </ButtonGroup>
  ),
}
