import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert, Button, Stack } from '@greese/react'
import { InfoIcon } from '@greese/icons'

const meta = {
  title: 'Content/Alert',
  component: Alert,
  args: {
    tone: 'info',
    title: 'Scheduled maintenance',
    icon: <InfoIcon />,
    children: 'The dashboard will be read-only on Sunday from 02:00 to 03:00 UTC.',
  },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: [
        'info',
        'positive',
        'warning',
        'negative',
        'neutral',
        'primary',
        'secondary',
        'tertiary',
      ],
    },
    variant: { control: 'inline-radio', options: ['soft', 'outline'] },
  },
} satisfies Meta<typeof Alert>
export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Tones: Story = {
  render: () => (
    <Stack gap={3} maxW="36rem">
      <Alert tone="positive" title="Payment received" onDismiss={() => {}} />
      <Alert
        tone="warning"
        title="Your trial ends in 3 days"
        actions={
          <Button size="sm" variant="outline" tone="neutral">
            Upgrade
          </Button>
        }
      />
      <Alert tone="negative" variant="outline" title="Couldn't save">
        Check your connection and try again.
      </Alert>
      <Alert tone="secondary" title="New: dark mode">
        A brand tone, for announcements rather than status.
      </Alert>
    </Stack>
  ),
}
