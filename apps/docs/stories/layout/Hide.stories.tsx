import type { Meta, StoryObj } from '@storybook/react-vite'
import { Hide, Tile } from '@greese-ui/react'

/** Show's opposite: hides its children in a breakpoint range, in CSS only. */
const meta = {
  title: 'Layout/Hide',
  component: Hide,
  args: { above: 'md', children: <Tile>Hidden from md up</Tile> },
} satisfies Meta<typeof Hide>
export default meta

type Story = StoryObj<typeof meta>

/** Resize the viewport past md. */
export const Playground: Story = {}

export const Between: Story = {
  args: { above: 'sm', below: 'lg', children: <Tile>Hidden between sm and lg</Tile> },
}
