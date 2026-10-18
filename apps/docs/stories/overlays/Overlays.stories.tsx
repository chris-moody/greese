import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  Dialog,
  Drawer,
  Menu,
  MenuItem,
  MenuSeparator,
  Popover,
  Stack,
  Text,
  TextField,
  toast,
  Toaster,
  Tooltip,
} from '@sauce-ui/react'

const meta = { title: 'Overlays/Overlays' } satisfies Meta
export default meta

type Story = StoryObj

/** Native `<dialog>`: focus trapped and returned, page inert and scroll-locked, Escape closes. */
export const Dialogs: Story = {
  render: () => (
    <Stack direction="row" gap={2} wrap="wrap">
      <Dialog
        trigger={<Button>Edit profile</Button>}
        title="Edit profile"
        description="Changes are visible to your team."
        footer={
          <>
            <Button variant="outline" tone="neutral">
              Cancel
            </Button>
            <Button>Save</Button>
          </>
        }
      >
        <Stack gap={4}>
          <TextField label="Name" defaultValue="Ada Lovelace" />
          <TextField label="Role" defaultValue="Analyst" />
        </Stack>
      </Dialog>
      <Dialog
        trigger={
          <Button tone="negative" variant="outline">
            Delete project
          </Button>
        }
        title="Delete project?"
        description="This permanently removes the project and its history."
        size="sm"
        footer={
          <form method="dialog">
            <Button type="submit" tone="negative">
              Delete
            </Button>
          </form>
        }
      />
    </Stack>
  ),
}

/**
 * A bottom sheet on phones and a side panel from md. Resize the viewport.
 * Drag the header (or the sheet's handle) toward the edge to dismiss.
 */
export const ResponsiveDrawer: Story = {
  render: () => (
    <Drawer
      trigger={<Button variant="outline">Filters</Button>}
      title="Filters"
      placement={{ xs: 'bottom', md: 'end' }}
      footer={<Button fullWidth>Apply</Button>}
    >
      <Text tone="muted">Filter controls go here.</Text>
    </Drawer>
  ),
}

/** Popover API + CSS anchor positioning: flips when there is no room. */
export const PopoverMenuTooltip: Story = {
  render: () => (
    <Stack direction="row" gap={3} align="center" wrap="wrap">
      <Popover
        trigger={<Button variant="outline">Details</Button>}
        label="Project details"
      >
        <Stack gap={2}>
          <Text weight="semibold">Sauce UI</Text>
          <Text size="sm" tone="muted">
            Created 17 October 2026. Popovers close on Escape or a click outside.
          </Text>
        </Stack>
      </Popover>
      <Menu trigger={<Button variant="outline">Actions</Button>}>
        <MenuItem>Rename</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem disabled>Move (no permission)</MenuItem>
        <MenuSeparator />
        <MenuItem tone="negative">Delete</MenuItem>
      </Menu>
      <Tooltip content="Copies a share link to your clipboard">
        <Button variant="ghost" tone="neutral">
          Share
        </Button>
      </Tooltip>
    </Stack>
  ),
}

export const Toasts: Story = {
  render: () => (
    <>
      <Stack direction="row" gap={2} wrap="wrap">
        <Button
          onClick={() =>
            toast({
              title: 'Message archived',
              action: {
                label: 'Undo',
                onClick: () => toast({ title: 'Restored', tone: 'positive' }),
              },
            })
          }
        >
          Archive
        </Button>
        <Button
          variant="outline"
          tone="negative"
          onClick={() =>
            toast({
              title: "Couldn't save",
              description: 'Check your connection.',
              tone: 'negative',
            })
          }
        >
          Fail
        </Button>
      </Stack>
      <Toaster />
    </>
  ),
}
