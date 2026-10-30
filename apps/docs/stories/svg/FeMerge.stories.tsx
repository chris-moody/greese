import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeGaussianBlur, FeMerge, FeMergeNode, FeOffset } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** Stacks inputs, the first at the bottom: a soft shadow under the shape. */
const meta = {
  title: 'SVG/FeMerge',
  component: FeMerge,
  subcomponents: { FeMergeNode },
  args: {
    children: [
      <FeMergeNode key="shadow" in="shadow" />,
      <FeMergeNode key="shape" in="SourceGraphic" />,
    ],
  },
  render: (args) => (
    <>
      <FeOffset in="SourceAlpha" x={3} y={4} result="moved" />
      <FeGaussianBlur in="moved" deviation={3} result="shadow" />
      <FeMerge {...args} />
    </>
  ),
  decorators: [filterStage('story-femerge')],
} satisfies Meta<typeof FeMerge>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
