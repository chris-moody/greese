import type { Meta, StoryObj } from '@storybook/react-vite'
import { Grid, GridItem } from '@greese-ui/react'
import { Tile } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Layout/Grid',
  component: Grid,
  subcomponents: { GridItem },
} satisfies Meta<typeof Grid>
export default meta

type Story = StoryObj<typeof meta>

const tiles = (n: number) =>
  Array.from({ length: n }, (_, i) => <Tile key={i}>{i + 1}</Tile>)

/** One column on phones, two from `sm`, four from `lg`. */
export const ResponsiveColumns: Story = {
  args: { columns: { xs: 1, sm: 2, lg: 4 }, gap: 3, children: tiles(8) },
}

/** As many columns as fit at 12rem each: responsive with no breakpoints at all. */
export const MinChildWidth: Story = {
  args: { minChildWidth: '12rem', gap: 3, children: tiles(10) },
}

/**
 * With `container`, spans respond to the grid's own width. The same markup is
 * stacked in the narrow column and split in the wide one.
 */
export const ContainerQueries: Story = {
  render: () => (
    <Grid columns={{ xs: 1, md: '16rem 1fr' }} gap={4}>
      {['narrow', 'wide'].map((label) => (
        <Grid key={label} container columns={12} gap={2}>
          <GridItem span={{ xs: 12, sm: 6 }}>
            <Tile>{label}: half from sm</Tile>
          </GridItem>
          <GridItem span={{ xs: 12, sm: 6 }}>
            <Tile>{label}: half from sm</Tile>
          </GridItem>
        </Grid>
      ))}
    </Grid>
  ),
}
