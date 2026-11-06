import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Carousel, CarouselSlide, CarouselPrevious, Tile } from '@greese/react'

/**
 * The previous control, for a Carousel's own `controls`: a button, disabled on
 * the first slide unless the carousel loops. With `asChild`, your element (a
 * router link, say) gets its wiring and keeps its own look. A link never moves
 * the carousel itself: it navigates, and the carousel follows the controlled
 * `index` your router gives it.
 */
const meta = {
  title: 'Content/CarouselPrevious',
  component: CarouselPrevious,
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
} satisfies Meta<typeof CarouselPrevious>
export default meta

type Story = StoryObj<typeof meta>

/** With no children: the carousel's chevron, named by its `previousLabel`. */
export const Playground: Story = {}

/** Your element, with the control's behaviour and its own look. */
export const AsChild: Story = {
  args: { asChild: true, children: <Button variant="outline">Back</Button> },
}
