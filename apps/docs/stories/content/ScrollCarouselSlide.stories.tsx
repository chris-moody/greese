import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScrollCarousel, ScrollCarouselSlide, Tile } from '@greese-ui/react'

/** One slide: a group announced as "n of count", or by its own `label`. */
const meta = {
  title: 'Content/ScrollCarouselSlide',
  component: ScrollCarouselSlide,
  args: { children: <Tile>This slide</Tile> },
  decorators: [
    (Story) => (
      <ScrollCarousel label="Example" perView={2}>
        <Story />
        <ScrollCarouselSlide>
          <Tile>Another slide</Tile>
        </ScrollCarouselSlide>
        <ScrollCarouselSlide>
          <Tile>A third</Tile>
        </ScrollCarouselSlide>
      </ScrollCarousel>
    ),
  ],
} satisfies Meta<typeof ScrollCarouselSlide>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const CustomLabel: Story = { args: { label: 'Introduction' } }
