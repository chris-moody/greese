import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  ContextMenu,
  MenuItem,
  MenuSeparator,
  Text,
  type ContextMenuPoint,
} from '@greese/react'

const meta = {
  title: 'Overlays/ContextMenu',
  component: ContextMenu,
  args: {
    children: (
      <>
        <MenuItem>Rename</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem disabled>Move (no permission)</MenuItem>
        <MenuSeparator />
        <MenuItem tone="negative">Delete</MenuItem>
      </>
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
    anchor: { control: false },
  },
} satisfies Meta<typeof ContextMenu>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Right-click (or long-press) the panel. `anchor` is both where the menu opens
 * and whether it is open, so opening one is a single piece of state.
 */
export const Playground: Story = {
  render: function Render(args) {
    const [at, setAt] = useState<ContextMenuPoint | null>(null)
    return (
      <>
        <div
          className="p-6 border border-color-border"
          onContextMenu={(event) => {
            event.preventDefault()
            setAt({ top: event.clientY, left: event.clientX })
          }}
        >
          <Text variant="p2">Right-click anywhere in this panel.</Text>
        </div>
        <ContextMenu {...args} anchor={at} onClose={() => setAt(null)} />
      </>
    )
  },
}

/**
 * Give it an element instead of a point and it hangs off that element, which
 * is how a submenu opens from the item that owns it.
 */
export const AsASubmenu: Story = {
  render: function Render(args) {
    const trigger = useRef<HTMLButtonElement>(null)
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button ref={trigger} variant="outline" onClick={() => setOpen(true)}>
          Move to…
        </Button>
        <ContextMenu
          {...args}
          anchor={open ? trigger.current : null}
          onClose={() => setOpen(false)}
          placement="end"
        >
          <MenuItem>Inbox</MenuItem>
          <MenuItem>Archive</MenuItem>
          <MenuItem>Drafts</MenuItem>
        </ContextMenu>
      </>
    )
  },
}
