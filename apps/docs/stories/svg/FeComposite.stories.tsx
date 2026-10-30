import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeComposite, FeFlood } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** Combines two inputs: here a flood kept only inside the shape (`operator="in"`), a tint. */
const meta = {
  title: 'SVG/FeComposite',
  component: FeComposite,
  args: { in: 'tint', in2: 'SourceAlpha', operator: 'in' },
  // What it combines comes first in the filter.
  render: (args) => (
    <>
      <FeFlood color="gold" result="tint" />
      <FeComposite {...args} />
    </>
  ),
  decorators: [filterStage('story-fecomposite')],
} satisfies Meta<typeof FeComposite>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
