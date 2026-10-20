import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Popover, Stack, Text } from '@greese/react'

const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  args: {
    trigger: <Button variant="outline">Details</Button>,
    label: 'Project details',
    placement: 'bottom-start',
    children: (
      <Stack gap={2}>
        <Text weight="semibold">Greese UI</Text>
        <Text size="sm" tone="muted">
          Created 17 October 2026. Popovers close on Escape or a click outside.
        </Text>
      </Stack>
    ),
  },
  argTypes: {
    placement: {
      control: 'select',
      options: [
        'bottom',
        'bottom-start',
        'bottom-end',
        'top',
        'top-start',
        'top-end',
        'start',
        'end',
      ],
    },
  },
} satisfies Meta<typeof Popover>
export default meta

type Story = StoryObj<typeof meta>

/** Popover API + CSS anchor positioning: flips when there is no room. */
export const Playground: Story = {}
