import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card, CardMedia, Heading, Image, Stack, Text } from '@greese/react'
import { art } from '../_shared/fixtures.tsx'

/** Media that bleeds through a Card's padding to its edges. */
const meta = {
  title: 'Content/CardMedia',
  component: CardMedia,
  args: {
    children: <Image alt="" src={art(200)} ratio={16 / 9} placeholder="#ccd" />,
  },
  decorators: [
    (Story) => (
      <Card style={{ maxInlineSize: '20rem' }}>
        <Story />
        <Stack gap={2}>
          <Heading level={3} size="lg">
            Card title
          </Heading>
          <Text tone="muted" size="sm">
            The media above reaches the card&apos;s edges.
          </Text>
        </Stack>
      </Card>
    ),
  ],
} satisfies Meta<typeof CardMedia>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
