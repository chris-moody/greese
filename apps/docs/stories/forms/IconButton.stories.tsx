import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconButton, Stack } from '@greese-ui/react'
import { PlusIcon, StarIcon, TrashIcon } from '../_shared/fixtures.tsx'

const meta = {
  title: 'Forms/IconButton',
  component: IconButton,
  args: { label: 'Add to favourites', children: <StarIcon /> },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'soft', 'outline', 'ghost'] },
    tone: { control: 'inline-radio', options: ['accent', 'neutral', 'negative'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof IconButton>
export default meta

type Story = StoryObj<typeof meta>

/** `label` is required: it is the button's accessible name. */
export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <Stack direction="row" gap={2} align="center">
      <IconButton label="Add" variant="solid" tone="accent">
        <PlusIcon />
      </IconButton>
      <IconButton label="Favourite" variant="soft" tone="accent">
        <StarIcon />
      </IconButton>
      <IconButton label="Favourite" variant="outline" tone="neutral">
        <StarIcon />
      </IconButton>
      <IconButton label="Delete" tone="negative">
        <TrashIcon />
      </IconButton>
      <IconButton label="Delete" size="sm" tone="negative" loading>
        <TrashIcon />
      </IconButton>
    </Stack>
  ),
}
