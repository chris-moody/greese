import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge, Stack } from '@greese/react'

const meta = {
  title: 'Content/Badge',
  component: Badge,
  args: { children: 'New', tone: 'primary' },
  argTypes: {
    tone: {
      control: 'select',
      options: [
        'neutral',
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
    variant: { control: 'inline-radio', options: ['soft', 'solid', 'outline'] },
  },
} satisfies Meta<typeof Badge>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const All: Story = {
  render: () => (
    <Stack gap={3}>
      {(['soft', 'solid', 'outline'] as const).map((variant) => (
        <Stack key={variant} direction="row" gap={2} wrap="wrap">
          {(
            [
              'neutral',
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
            <Badge key={tone} tone={tone} variant={variant}>
              {tone}
            </Badge>
          ))}
        </Stack>
      ))}
    </Stack>
  ),
}
