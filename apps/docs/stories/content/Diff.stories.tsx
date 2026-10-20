import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Diff, Text } from '@greese/react'
import { art } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Content/Diff',
  component: Diff,
  args: {
    label: 'Before and after',
    before: <img src={art(200)} alt="The original" />,
    after: <img src={art(20)} alt="The edit" />,
    beforeLabel: 'Before',
    afterLabel: 'After',
    style: { maxInlineSize: '36rem', aspectRatio: '16 / 9' },
  },
} satisfies Meta<typeof Diff>
export default meta

type Story = StoryObj<typeof meta>

/** Drag the grip, tap anywhere, or focus it and use the arrow keys. */
export const Playground: Story = {}

/** Anything can be compared, text included. */
export const Text_: Story = {
  name: 'Text',
  args: {
    defaultValue: 35,
    before: (
      <Box p={6} style={{ background: 'var(--greese-color-surface)' }}>
        <Text size="2xl" weight="bold">
          The quick brown fox
        </Text>
      </Box>
    ),
    after: (
      <Box p={6} style={{ background: 'var(--greese-color-canvas)' }}>
        <Text size="2xl" weight="bold" tone="primary">
          The quick brown fox
        </Text>
      </Box>
    ),
    beforeLabel: undefined,
    afterLabel: undefined,
    style: { maxInlineSize: '36rem' },
  },
}
