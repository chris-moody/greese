import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Text } from '@greese/react'

const meta = {
  title: 'Content/Text',
  component: Text,
  args: {
    size: { xs: 'md', md: 'lg' },
    children: 'Responsive body text: md on phones, lg from md.',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        undefined,
        'p1',
        'p2',
        'p3',
        's1',
        's2',
        'caption',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'button',
      ],
    },
    weight: {
      control: 'inline-radio',
      options: ['regular', 'medium', 'semibold', 'bold'],
    },
    tone: {
      control: 'select',
      options: [
        'neutral',
        'muted',
        'primary',
        'secondary',
        'tertiary',
        'accent',
        'positive',
        'negative',
        'warning',
        'info',
      ],
    },
  },
} satisfies Meta<typeof Text>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** A named style from the type system: size, weight, spacing and line height for every breakpoint. */
export const Variants: Story = {
  render: () => (
    <Stack gap={2}>
      {(['p1', 'p2', 'p3', 's1', 's2', 'caption'] as const).map((variant) => (
        <Text key={variant} variant={variant}>
          {variant}: The quick brown fox jumps over the lazy dog.
        </Text>
      ))}
    </Stack>
  ),
}

export const Tones: Story = {
  render: () => (
    <Stack direction="row" gap={3} wrap="wrap">
      {(
        [
          'neutral',
          'muted',
          'primary',
          'secondary',
          'tertiary',
          'accent',
          'positive',
          'negative',
          'warning',
          'info',
        ] as const
      ).map((tone) => (
        <Text key={tone} tone={tone} weight="semibold">
          {tone}
        </Text>
      ))}
    </Stack>
  ),
}

/** `truncate` cuts to one line; a number clamps to that many lines. */
export const Truncation: Story = {
  args: {
    size: 'md',
    truncate: 2,
    style: { maxInlineSize: '24rem' },
    children:
      'Clamped to two lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
  },
}
