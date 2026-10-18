import type { Meta, StoryObj } from '@storybook/react-vite'
import { Image, Stack } from '@sauce-ui/react'
import { art } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Content/Image',
  component: Image,
  args: {
    alt: 'Abstract illustration',
    src: art(260),
    ratio: { xs: 1, md: 16 / 9 },
    radius: 'lg',
  },
  decorators: [(Story) => <div style={{ maxInlineSize: '28rem' }}>{Story()}</div>],
} satisfies Meta<typeof Image>
export default meta

type Story = StoryObj<typeof meta>

/** Lazy by default; the ratio reserves space so nothing shifts. */
export const Playground: Story = {}

export const PlaceholderAndFallback: Story = {
  render: () => (
    <Stack gap={4}>
      <Image alt="" src={art(140)} ratio={2} placeholder="#cfd8dc" radius="md" />
      <Image
        alt="Missing"
        src="/does-not-exist.png"
        ratio={2}
        fallback="Image unavailable"
        radius="md"
      />
    </Stack>
  ),
}
