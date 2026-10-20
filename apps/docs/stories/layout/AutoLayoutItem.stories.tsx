import type { Meta, StoryObj } from '@storybook/react-vite'
import { AutoLayout, AutoLayoutItem, Tile } from '@greese/react'

/** An AutoLayout item: a size in twelfths, and how far it may grow. */
const meta = {
  title: 'Layout/AutoLayoutItem',
  component: AutoLayoutItem,
  args: {
    size: { xs: 12, md: 4 },
    maxSize: { md: 8 },
    children: <Tile>4, grows to 8</Tile>,
  },
  decorators: [
    (Story) => (
      <AutoLayout gap={3}>
        <AutoLayoutItem size={{ xs: 12, md: 4 }}>
          <Tile>4</Tile>
        </AutoLayoutItem>
        <Story />
      </AutoLayout>
    ),
  ],
} satisfies Meta<typeof AutoLayoutItem>
export default meta

type Story = StoryObj<typeof meta>

/** From md, it widens into the room its row leaves. */
export const Playground: Story = {}
