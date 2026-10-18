import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Dialog, Stack, TextField } from '@greese-ui/react'

const meta = {
  title: 'Overlays/Dialog',
  component: Dialog,
  args: {
    trigger: <Button>Edit profile</Button>,
    title: 'Edit profile',
    description: 'Changes are visible to your team.',
    footer: (
      <>
        <Button variant="outline" tone="neutral">
          Cancel
        </Button>
        <Button>Save</Button>
      </>
    ),
    children: (
      <Stack gap={4}>
        <TextField label="Name" defaultValue="Ada Lovelace" />
        <TextField label="Role" defaultValue="Analyst" />
      </Stack>
    ),
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'full'] } },
} satisfies Meta<typeof Dialog>
export default meta

type Story = StoryObj<typeof meta>

/** Native `<dialog>`: focus trapped and returned, page inert and scroll-locked, Escape closes. */
export const Playground: Story = {}

/**
 * A destructive confirmation. It can still be dismissed (Escape, the backdrop,
 * the close button): closing it any of those ways is a cancel.
 */
export const Confirmation: Story = {
  args: {
    trigger: (
      <Button tone="negative" variant="outline">
        Delete project
      </Button>
    ),
    title: 'Delete project?',
    description: 'This permanently removes the project and its history.',
    size: 'sm',
    children: undefined,
    footer: (
      <form method="dialog">
        <Button type="submit" variant="ghost">
          Cancel
        </Button>
        <Button type="submit" tone="negative">
          Delete
        </Button>
      </form>
    ),
  },
}
