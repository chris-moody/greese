import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  Card,
  ScrollCarousel,
  ScrollCarouselSlide,
  Heading,
  Image,
  Stack,
  Text,
} from '@greese/react'
import { art } from '../_shared/fixtures.tsx'

const places = ['Harbour', 'Ridge', 'Meadow', 'Coast', 'Forest', 'Valley']

const slides = places.map((place, i) => (
  <ScrollCarouselSlide key={place}>
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <Image alt="" src={art(40 + i * 50)} ratio={16 / 9} placeholder="#ccd" />
      <Stack gap={1} p={4}>
        <Heading level={3} variant="h6">
          {place}
        </Heading>
        <Text variant="p3" tone="muted">
          Slide {i + 1} of {places.length}
        </Text>
      </Stack>
    </Card>
  </ScrollCarouselSlide>
))

const meta = {
  title: 'Content/ScrollCarousel',
  component: ScrollCarousel,
  subcomponents: { ScrollCarouselSlide },
  args: { label: 'Places', children: slides },
} satisfies Meta<typeof ScrollCarousel>
export default meta

type Story = StoryObj<typeof meta>

/** Swipe, scroll or use the buttons (where a pointer can hover) and dots. */
export const Playground: Story = {}

/** One and a bit on phones, so the next slide peeks in; three from md. */
export const SeveralInView: Story = {
  args: { perView: { xs: 1.15, md: 3 }, gap: 4 },
}

/** Next on the last slide wraps to the first. */
export const Looping: Story = { args: { loop: true, indicators: false } }

/** A column that scrolls and snaps on y; the buttons sit above and below. */
export const Vertical: Story = {
  args: { orientation: 'vertical', style: { maxInlineSize: '24rem' } },
}

/**
 * `strip`: a row of controls that scrolls when it overflows, each as wide as
 * its content. The controls keep their own roles; the buttons scroll a view
 * along, for the pointer, as keys move through the controls.
 */
export const Strip: Story = {
  args: {
    label: 'tools',
    strip: true,
    style: { maxInlineSize: '20rem' },
    children: [
      'Select',
      'Direct select',
      'Rectangle',
      'Ellipse',
      'Polygon',
      'Pen',
      'Pencil',
      'Text',
      'Cutout',
    ].map((tool) => (
      <ScrollCarouselSlide key={tool}>
        <Button size="sm" variant="outline">
          {tool}
        </Button>
      </ScrollCarouselSlide>
    )),
  },
}
