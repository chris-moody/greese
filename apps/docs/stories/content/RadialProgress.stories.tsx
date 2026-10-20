import type { Meta, StoryObj } from '@storybook/react-vite'
import { RadialProgress, Stack } from '@greese/react'

const meta = {
  title: 'Content/RadialProgress',
  component: RadialProgress,
  args: { value: 72, 'aria-label': 'Storage used' },
  argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
} satisfies Meta<typeof RadialProgress>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" gap={4} align="center" wrap="wrap">
      <RadialProgress value={25} size="2.5rem" aria-label="Small" />
      <RadialProgress value={50} aria-label="Default" />
      <RadialProgress value={90} size="6rem" thickness="6%" aria-label="Large, thin" />
      <RadialProgress value={3} max={4} size="5rem" aria-label="Steps done">
        3 / 4
      </RadialProgress>
    </Stack>
  ),
}

/** No value: an indeterminate ring (still under reduced motion). */
export const Indeterminate: Story = {
  args: { value: undefined, 'aria-label': 'Loading' },
}
