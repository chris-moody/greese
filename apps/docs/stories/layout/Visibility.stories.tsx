import type { Meta, StoryObj } from '@storybook/react-vite'
import { Hide, Show, Tile } from '@greese-ui/react'

const meta = {
  title: 'Layout/Show and Hide',
  component: Show,
  subcomponents: { Hide },
  args: { above: 'md', children: <Tile>Visible from md up</Tile> },
} satisfies Meta<typeof Show>
export default meta

type Story = StoryObj<typeof meta>

/** CSS-only: no matchMedia, no hydration mismatch. Resize the viewport. */
export const ShowAbove: Story = {}

export const Ranges: Story = {
  render: () => (
    <>
      <Show below="md">
        <Tile>Visible below md</Tile>
      </Show>
      <Show above="sm" below="lg">
        <Tile>Visible between sm and lg</Tile>
      </Show>
      <Hide above="sm" below="lg">
        <Tile>Hidden between sm and lg</Tile>
      </Hide>
    </>
  ),
}
