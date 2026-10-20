import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Avatar,
  Badge,
  Grid,
  IconButton,
  Indicator,
  Status,
  Tile,
} from '@greese/react'
import { BellIcon } from '@greese/icons'

const meta = {
  title: 'Layout/Indicator',
  component: Indicator,
  args: {
    content: (
      <Badge tone="negative" variant="solid">
        3
      </Badge>
    ),
    children: (
      <IconButton label="Notifications, 3 unread" variant="soft" tone="neutral">
        <BellIcon />
      </IconButton>
    ),
  },
  argTypes: {
    placement: {
      control: 'select',
      options: [
        'top-start',
        'top',
        'top-end',
        'start',
        'center',
        'end',
        'bottom-start',
        'bottom',
        'bottom-end',
      ],
    },
  },
} satisfies Meta<typeof Indicator>
export default meta

type Story = StoryObj<typeof meta>

/** The count is in the button's name too: the badge itself is only visual. */
export const Playground: Story = {}

export const OnAnAvatar: Story = {
  args: {
    placement: 'bottom-end',
    content: <Status tone="positive" label="Online" size="lg" />,
    children: <Avatar name="Ada Lovelace" />,
  },
}

export const Placements: Story = {
  render: () => (
    <Grid
      container
      columns={3}
      gap={6}
      style={{ maxInlineSize: '34rem', padding: '1.5rem 3rem' }}
    >
      {(
        [
          'top-start',
          'top',
          'top-end',
          'start',
          'center',
          'end',
          'bottom-start',
          'bottom',
          'bottom-end',
        ] as const
      ).map((placement) => (
        <Indicator
          key={placement}
          placement={placement}
          content={<Badge tone="primary">{placement}</Badge>}
          style={{ inlineSize: '100%' }}
        >
          <Tile style={{ inlineSize: '100%', blockSize: '4rem' }} />
        </Indicator>
      ))}
    </Grid>
  ),
}
