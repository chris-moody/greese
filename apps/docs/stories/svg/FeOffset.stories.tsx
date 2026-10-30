import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeOffset } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** Shifts its input: here the source's alpha, a hard shadow under nothing else. */
const meta = {
  title: 'SVG/FeOffset',
  component: FeOffset,
  args: { in: 'SourceAlpha', x: 4, y: 6 },
  decorators: [filterStage('story-feoffset')],
} satisfies Meta<typeof FeOffset>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
