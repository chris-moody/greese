import type { Meta, StoryObj } from '@storybook/react-vite'
import { Carousel, CarouselSlide, Tile } from '@greese/react'

/**
 * One slide: a group announced as "n of count", or by its own `label`. Only
 * the one shown is interactive; the others are inert. An `id` makes it
 * deep-linkable.
 */
const meta = {
  title: 'Content/CarouselSlide',
  component: CarouselSlide,
  args: { children: <Tile>This slide</Tile> },
  decorators: [
    (Story) => (
      <Carousel label="Example" style={{ maxInlineSize: '24rem' }}>
        <Story />
        <CarouselSlide>
          <Tile>Another slide</Tile>
        </CarouselSlide>
      </Carousel>
    ),
  ],
} satisfies Meta<typeof CarouselSlide>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const CustomLabel: Story = { args: { label: 'Introduction' } }

/** Deep-linkable: a page opened on `#carousel-intro` shows it. */
export const Linkable: Story = { args: { id: 'carousel-intro' } }
