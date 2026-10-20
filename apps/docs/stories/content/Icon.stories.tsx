import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon, Stack, Text } from '@greese/react'
import { InfoIcon, StarIcon } from '@greese/icons'

const meta = {
  title: 'Content/Icon',
  component: Icon,
  args: { children: <StarIcon /> },
} satisfies Meta<typeof Icon>
export default meta

type Story = StoryObj<typeof meta>

/** Decorative by default (aria-hidden); inherits color and scales with text. */
export const Playground: Story = {}

export const Labelled: Story = {
  args: {
    label: 'Verified account',
    size: '1.5rem',
    style: { color: 'var(--greese-color-primary)' },
  },
}

export const ScalesWithText: Story = {
  render: () => (
    <Stack gap={2}>
      {(['p3', 'p2', 's1', 'h2'] as const).map((variant) => (
        <Text key={variant} variant={variant}>
          <Icon>
            <InfoIcon />
          </Icon>{' '}
          Text at {variant}
        </Text>
      ))}
    </Stack>
  ),
}
