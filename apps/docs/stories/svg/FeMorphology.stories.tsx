import type { Meta, StoryObj } from '@storybook/react-vite'
import { FeMorphology } from '@greese/react/svg'
import { filterStage } from '../_shared/FilterStage.tsx'

/** Thickens (`dilate`) or thins (`erode`) the shape. */
const meta = {
  title: 'SVG/FeMorphology',
  component: FeMorphology,
  args: { operator: 'dilate', radius: 3 },
  decorators: [filterStage('story-femorphology')],
} satisfies Meta<typeof FeMorphology>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Thinner. */
export const Erode: Story = { args: { operator: 'erode', radius: 2 } }
