import type { Meta, StoryObj } from '@storybook/react-vite'
import { Video } from '@greese-ui/react'
import { art } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Content/Video',
  component: Video,
  args: { poster: art(30), 'aria-label': 'Product walkthrough' },
  decorators: [(Story) => <div style={{ maxInlineSize: '32rem' }}>{Story()}</div>],
} satisfies Meta<typeof Video>
export default meta

type Story = StoryObj<typeof meta>

/** Native video in a ratio frame: controls, plays inline on iOS. */
export const Playground: Story = {}

export const Square: Story = { args: { ratio: 1 } }
