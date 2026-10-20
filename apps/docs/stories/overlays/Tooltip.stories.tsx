import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, IconButton, Stack, Tooltip } from '@greese/react'
import { TrashIcon } from '@greese/icons'

const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  args: {
    content: 'Copies a share link to your clipboard',
    children: (
      <Button variant="ghost" tone="neutral">
        Share
      </Button>
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
} satisfies Meta<typeof Tooltip>
export default meta

type Story = StoryObj<typeof meta>

/** Opens on hover after a delay and at once on keyboard focus. Never put essential information in one. */
export const Playground: Story = {}

export const Placements: Story = {
  render: () => (
    <Stack direction="row" gap={3} wrap="wrap" p={8}>
      {(['top', 'bottom', 'start', 'end'] as const).map((placement) => (
        <Tooltip key={placement} content={`Placed ${placement}`} placement={placement}>
          <IconButton label={`Delete (${placement})`} variant="outline" tone="neutral">
            <TrashIcon />
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  ),
}
