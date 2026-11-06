import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Carousel, CarouselIndicator, CarouselSlide, Tile } from '@greese/react'

/**
 * A dot that jumps to one slide, for a Carousel's own `indicators`, marked
 * `aria-current` on the slide shown. With `asChild`, your element gets its
 * behaviour, names itself, and keeps its own look.
 */
const meta = {
  title: 'Content/CarouselIndicator',
  component: CarouselIndicator,
  args: { index: 1 },
  decorators: [
    (Story) => (
      <Carousel label="Example" style={{ maxInlineSize: '24rem' }} indicators={<Story />}>
        <CarouselSlide>
          <Tile>One</Tile>
        </CarouselSlide>
        <CarouselSlide>
          <Tile>Two</Tile>
        </CarouselSlide>
      </Carousel>
    ),
  ],
} satisfies Meta<typeof CarouselIndicator>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Your element, named by you. */
export const AsChild: Story = {
  args: {
    asChild: true,
    children: (
      <Button size="sm" variant="ghost" aria-label="Go to slide 2">
        2
      </Button>
    ),
  },
}
