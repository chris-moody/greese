import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heading, Stack } from '@greese/react'

const meta = {
  title: 'Content/Heading',
  component: Heading,
  args: { level: 2, children: 'A section heading' },
  argTypes: {
    level: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] },
    variant: {
      control: 'select',
      options: [undefined, 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 's1', 's2', 'p1'],
    },
  },
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

/** `level` sets the outline; `variant` sets the look. */
export const LookIndependentOfLevel: Story = {
  args: {
    level: 2,
    variant: 'h6',
    tone: 'muted',
    children: 'A level-2 heading styled small',
  },
}

/** A `variant` takes its look from the type system, so an `<h2>` can look like an `h4`. */
export const Variants: Story = {
  render: () => (
    <Stack gap={3}>
      {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((variant) => (
        <Heading key={variant} level={2} variant={variant}>
          A level-2 heading in the {variant} style
        </Heading>
      ))}
    </Stack>
  ),
}
