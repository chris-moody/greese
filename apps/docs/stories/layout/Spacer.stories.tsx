import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spacer, Stack, Tile } from '@greese-ui/react'

const meta = { title: 'Layout/Spacer', component: Spacer } satisfies Meta<typeof Spacer>
export default meta

type Story = StoryObj<typeof meta>

/** Without `size`, it grows and pushes its neighbours apart. */
export const Flexible: Story = {
  render: () => (
    <Stack direction="row" align="center">
      <Tile>Logo</Tile>
      <Spacer />
      <Tile>Sign in</Tile>
    </Stack>
  ),
}

/** With `size`, a fixed gap along the main axis, per breakpoint if needed. */
export const Fixed: Story = {
  render: () => (
    <Stack direction="row">
      <Tile>One</Tile>
      <Spacer size={{ xs: 2, md: 8 }} />
      <Tile>Two</Tile>
    </Stack>
  ),
}
