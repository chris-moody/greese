import type { Meta, StoryObj } from '@storybook/react-vite'
import { Grid, Text, Tile } from '@greese/react'

const meta = {
  title: 'Layout/Tile',
  component: Tile,
  args: { children: 'A tile' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['filled', 'outline', 'dashed'] },
  },
} satisfies Meta<typeof Tile>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Filled, outline and dashed (for empty slots and drop zones). */
export const Variants: Story = {
  render: () => (
    <Grid container columns={{ xs: 1, sm: 3 }} gap={3}>
      <Tile>Filled</Tile>
      <Tile variant="outline">Outline</Tile>
      <Tile variant="dashed" p={5} textAlign="center">
        <Text size="sm" tone="muted">
          Drop files here
        </Text>
      </Tile>
    </Grid>
  ),
}
