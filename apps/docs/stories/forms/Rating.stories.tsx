import type { Meta, StoryObj } from '@storybook/react-vite'
import { Rating, Stack, Text } from '@greese/react'
import { HeartIcon } from '@greese/icons'

const meta = {
  title: 'Forms/Rating',
  component: Rating,
  args: { label: 'Your rating', defaultValue: 3 },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    step: { control: 'inline-radio', options: [1, 0.5, 0.25] },
  },
} satisfies Meta<typeof Rating>
export default meta

type Story = StoryObj<typeof meta>

/** Native radios: hover to preview, click or arrow keys to choose. */
export const Playground: Story = {}

/** Half stars: point or drag to choose; arrow keys move by a half. */
export const Halves: Story = { args: { step: 0.5, defaultValue: 3.5 } }

/** Quarter stars. On touch, drag across the stars and lift to choose. */
export const Quarters: Story = { args: { step: 0.25, defaultValue: 3.75, size: 'lg' } }

/** Choosing the current rating again clears it. */
export const Clearable: Story = { args: { allowClear: true, hideLabel: false } }

/** A value to show, not ask for: fractions are drawn exactly. */
export const ReadOnly: Story = {
  render: () => (
    <Stack direction="row" gap={2} align="center">
      <Rating label="Average rating" readOnly value={4.3} size="sm" />
      <Text variant="p3" tone="muted">
        4.3 (1,204 reviews)
      </Text>
    </Stack>
  ),
}

export const TenHearts: Story = {
  args: {
    max: 10,
    defaultValue: 7,
    size: 'sm',
    icon: <HeartIcon fill="currentColor" strokeWidth={0} />,
    getItemLabel: (n: number, max: number) => `${n} out of ${max}`,
  },
}
