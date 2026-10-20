import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider, Spacer, Stack, Tile } from '@greese-ui/react'

const meta = {
  title: 'Layout/Stack',
  component: Stack,
  args: { gap: 3 },
  argTypes: {
    direction: {
      control: 'inline-radio',
      options: ['column', 'row', 'row-reverse', 'column-reverse'],
    },
    gap: { control: { type: 'range', min: 0, max: 8 } },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between', 'around', 'evenly'],
    },
    wrap: { control: 'inline-radio', options: ['nowrap', 'wrap', 'wrap-reverse'] },
  },
  render: (args) => (
    <Stack {...args}>
      <Tile>One</Tile>
      <Tile>Two</Tile>
      <Tile>Three</Tile>
    </Stack>
  ),
} satisfies Meta<typeof Stack>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Column on phones, row from `md`; gap grows at `lg`. Resize the viewport. */
export const Responsive: Story = {
  args: { direction: { xs: 'column', md: 'row' }, gap: { xs: 2, lg: 6 } },
}

export const ToolbarWithSpacer: Story = {
  render: () => (
    <Stack direction="row" gap={2} align="center">
      <Tile>Logo</Tile>
      <Spacer />
      <Tile>Sign in</Tile>
      <Divider orientation="vertical" />
      <Tile>Menu</Tile>
    </Stack>
  ),
}
