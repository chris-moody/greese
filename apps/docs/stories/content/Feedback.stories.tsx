import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Chip,
  Progress,
  Skeleton,
  Spinner,
  Stack,
} from '@sauce-ui/react'

const meta = { title: 'Content/Feedback' } satisfies Meta
export default meta

type Story = StoryObj

export const Alerts: Story = {
  render: () => (
    <Stack gap={3} maxW="36rem">
      <Alert tone="info" title="Scheduled maintenance">
        The dashboard will be read-only on Sunday from 02:00 to 03:00 UTC.
      </Alert>
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
    </Stack>
  ),
}

export const BadgesAndChips: Story = {
  render: function Render() {
    const [tags, setTags] = useState(['Design', 'Frontend', 'Accessibility'])
    return (
      <Stack gap={4}>
        {(['soft', 'solid', 'outline'] as const).map((variant) => (
          <Stack key={variant} direction="row" gap={2} wrap="wrap">
            {(
              ['neutral', 'accent', 'positive', 'negative', 'warning', 'info'] as const
            ).map((tone) => (
              <Badge key={tone} tone={tone} variant={variant}>
                {tone}
              </Badge>
            ))}
          </Stack>
        ))}
        <Stack direction="row" gap={2} wrap="wrap">
          {tags.map((tag) => (
            <Chip key={tag} onRemove={() => setTags((t) => t.filter((x) => x !== tag))}>
              {tag}
            </Chip>
          ))}
          <Chip selectable defaultSelected>
            In stock
          </Chip>
          <Chip selectable>On sale</Chip>
        </Stack>
      </Stack>
    )
  },
}

export const Loading: Story = {
  render: () => (
    <Stack gap={5} maxW="28rem">
      <Stack direction="row" gap={4} align="center">
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
      </Stack>
      <Progress aria-label="Upload" value={64} />
      <Progress aria-label="Processing" size="sm" />
      <Stack direction="row" gap={3} align="center">
        <Skeleton shape="circle" />
        <Skeleton lines={2} />
      </Stack>
      <Skeleton shape="rect" />
    </Stack>
  ),
}
