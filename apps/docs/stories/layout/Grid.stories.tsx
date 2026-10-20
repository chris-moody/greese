import type { Meta, StoryObj } from '@storybook/react-vite'
import { Grid, Tile } from '@greese-ui/react'

const tiles = (n: number) =>
  Array.from({ length: n }, (_, i) => <Tile key={i}>{i + 1}</Tile>)

const meta = {
  title: 'Layout/Grid',
  component: Grid,
  args: { container: true, columns: { xs: 1, sm: 2, lg: 4 }, gap: 3, children: tiles(8) },
} satisfies Meta<typeof Grid>
export default meta

type Story = StoryObj<typeof meta>

/** `container` makes a grid: one column on phones, two from `sm`, four from `lg`. */
export const Playground: Story = {}

/** Without `container`, a Grid is a cell: `size` is how many columns it spans. */
export const Cells: Story = {
  args: {
    columns: 12,
    children: (
      <>
        <Grid size={{ xs: 12, md: 8 }}>
          <Tile>size: xs 12, md 8</Tile>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Tile>size: xs 12, md 4</Tile>
        </Grid>
        <Grid size="full">
          <Tile>size: full</Tile>
        </Grid>
      </>
    ),
  },
}

/** As many columns as fit at 12rem each: responsive with no breakpoints at all. */
export const MinChildWidth: Story = {
  args: { columns: undefined, minChildWidth: '12rem', children: tiles(10) },
}

/**
 * With `containerQueries`, cells' sizes respond to the grid's own width. The
 * same markup is stacked in the narrow column and split in the wide one; a
 * cell that is also a `container` nests a grid.
 */
export const ContainerQueries: Story = {
  args: { columns: { xs: 1, md: '16rem 1fr' }, gap: 4 },
  render: (args) => (
    <Grid {...args}>
      {['narrow', 'wide'].map((label) => (
        <Grid container key={label} containerQueries columns={12} gap={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Tile>{label}: half from sm</Tile>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Tile>{label}: half from sm</Tile>
          </Grid>
        </Grid>
      ))}
    </Grid>
  ),
}
