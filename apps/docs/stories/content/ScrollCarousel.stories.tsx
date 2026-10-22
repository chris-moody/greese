import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card, ScrollCarousel, ScrollCarouselSlide, Heading, Image, Stack, Text } from '@greese/react'
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
