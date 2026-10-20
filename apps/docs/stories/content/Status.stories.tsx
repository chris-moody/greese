import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Status, Text } from '@greese-ui/react'

const meta = {
  title: 'Content/Status',
  component: Status,
  args: { tone: 'positive', label: 'Online' },
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
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Status>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Decorative dots beside text that says the state. */
export const WithText: Story = {
  render: () => (
    <Stack gap={2}>
      {(
        [
          ['positive', 'Operational'],
          ['warning', 'Degraded'],
          ['negative', 'Outage'],
          ['neutral', 'Unknown'],
        ] as const
      ).map(([tone, text]) => (
        <Stack key={tone} direction="row" gap={2} align="center">
          <Status tone={tone} pulse={tone === 'negative'} />
          <Text size="sm">{text}</Text>
        </Stack>
      ))}
    </Stack>
  ),
}
