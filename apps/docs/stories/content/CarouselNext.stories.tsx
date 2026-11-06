import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Carousel, CarouselSlide, CarouselNext, Tile } from '@greese/react'

/**
 * The next control, for a Carousel's own `controls`: a button, disabled on the
 * last slide unless the carousel loops. With `asChild`, your element gets its
 * behaviour and keeps its own look.
 */
const meta = {
  title: 'Content/CarouselNext',
  component: CarouselNext,
  decorators: [
    (Story) => (
      <Carousel
        label="Example"
        style={{ maxInlineSize: '24rem' }}
        controls={<Story />}
        defaultIndex={1}
      >
        <CarouselSlide>
          <Tile>One</Tile>
        </CarouselSlide>
        <CarouselSlide>
          <Tile>Two</Tile>
        </CarouselSlide>
        <CarouselSlide>
          <Tile>Three</Tile>
        </CarouselSlide>
      </Carousel>
    ),
  ],
} satisfies Meta<typeof CarouselNext>
export default meta

type Story = StoryObj<typeof meta>

/** With no children: the carousel's chevron, named by its `nextLabel`. */
export const Playground: Story = {}

/** Your element, with the control's behaviour and its own look. */
export const AsChild: Story = {
  args: { asChild: true, children: <Button variant="outline">Next</Button> },
}
