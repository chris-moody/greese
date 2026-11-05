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
    open: { control: 'radio', options: [undefined, true, false] },
  },
} satisfies Meta<typeof Tooltip>
export default meta

type Story = StoryObj<typeof meta>

/** Opens on hover after a delay, at once on keyboard focus, and on a tap on touch screens. Never put essential information in one. */
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

/**
 * `open` drives it yourself: `true` keeps it up, `false` turns it off. Setting
 * it replaces the hover, focus and tap behaviour, so the tooltip shows exactly
 * when you say — a slider's value bubble works this way.
 */
export const AlwaysOpen: Story = {
  args: { open: true, content: 'Always visible' },
}

/** `open={false}` is off: nothing opens it, and it describes nothing. */
export const Disabled: Story = {
  args: { open: false, content: 'You will not see this' },
}
