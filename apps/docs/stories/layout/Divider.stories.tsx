import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider, Stack } from '@sauce-ui/react'
import { Tile } from '../_shared/fixtures.tsx'

const meta = { title: 'Layout/Divider', component: Divider } satisfies Meta<
  typeof Divider
>
export default meta

type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <Stack gap={3}>
      <Tile>Above</Tile>
      <Divider />
      <Tile>Below</Tile>
    </Stack>
  ),
}

/** In a row, a vertical divider stretches to the row's height. */
export const Vertical: Story = {
  render: () => (
    <Stack direction="row" gap={3} align="stretch">
      <Tile>Left</Tile>
      <Divider orientation="vertical" />
      <Tile>Right</Tile>
    </Stack>
  ),
}
