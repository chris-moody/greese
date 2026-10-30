import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeGaussianBlur, FeMerge, FeMergeNode } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** One layer of an `FeMerge`: here a blurred copy, under the shape. */
const meta = {
  title: 'SVG/FeMergeNode',
  component: FeMergeNode,
  args: { in: 'soft' },
  decorators: [
    (Story) => (
      <>
        <FeGaussianBlur deviation={4} result="soft" />
        <FeMerge>
          <Story />
          <FeMergeNode in="SourceGraphic" />
        </FeMerge>
      </>
    ),
    filterStage('story-femergenode'),
  ],
} satisfies Meta<typeof FeMergeNode>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
