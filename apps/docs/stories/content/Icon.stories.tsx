import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon, Stack, Text } from '@greese-ui/react'
import { InfoIcon, StarIcon } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Content/Icon',
  component: Icon,
  args: { children: <StarIcon /> },
} satisfies Meta<typeof Icon>
export default meta

type Story = StoryObj<typeof meta>

/** Decorative by default (aria-hidden); inherits colour and scales with text. */
export const Playground: Story = {}

export const Labelled: Story = {
  args: {
    label: 'Verified account',
    size: '1.5rem',
    style: { color: 'var(--greese-color-accent)' },
  },
}

export const ScalesWithText: Story = {
  render: () => (
    <Stack gap={2}>
      {(['sm', 'md', 'xl', '3xl'] as const).map((size) => (
        <Text key={size} size={size}>
          <Icon>
            <InfoIcon />
          </Icon>{' '}
          Text at {size}
        </Text>
      ))}
    </Stack>
  ),
}
