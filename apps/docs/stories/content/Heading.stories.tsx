import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heading, Stack } from '@greese/react'

const meta = {
  title: 'Content/Heading',
  component: Heading,
  args: { level: 2, children: 'A section heading' },
  argTypes: { level: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] } },
} satisfies Meta<typeof Heading>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Headings shrink on phones by default; resize to see them step up at md. */
export const Levels: Story = {
  render: () => (
    <Stack gap={3}>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Heading key={level} level={level}>
          Heading level {level}
        </Heading>
      ))}
    </Stack>
  ),
}

/** `level` sets the outline; `size` sets the look. */
export const SizeIndependentOfLevel: Story = {
  args: {
    level: 2,
    size: 'md',
    tone: 'muted',
    children: 'A level-2 heading styled small',
  },
}
