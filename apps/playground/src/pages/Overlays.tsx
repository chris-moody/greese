import { useRef, useState, type JSX } from 'react'
import {
  AppBar,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  ContextMenu,
  type ContextMenuPoint,
  Dialog,
  Drawer,
  Menu,
  MenuItem,
  MenuSeparator,
  Pagination,
  Popover,
  Sidebar,
  SidebarLayout,
  SidebarTrigger,
  Spacer,
  Stack,
  Text,
  toast,
  Toaster,
  Tooltip,
} from '@greese/react'
import '@greese/react/base.css'
import '@greese/react/styles.css'

/** Overlay and navigation fixtures for e2e/overlays.spec.ts. */
export const Overlays = (): JSX.Element => {
  const [selected, setSelected] = useState('')
  const [at, setAt] = useState<ContextMenuPoint | null>(null)
  const moveTo = useRef<HTMLButtonElement>(null)
  const [moving, setMoving] = useState(false)
  return (
    <SidebarLayout>
      <Sidebar label="Main navigation" data-testid="sidebar">
        <a href="#overview">Overview</a>
        <a href="#settings">Settings</a>
      </Sidebar>
      <div>
        <AppBar data-testid="appbar">
          <SidebarTrigger />
          <Text weight="semibold">Overlays</Text>
          <Spacer />
          <Tooltip content="Opens the help centre">
            <Button variant="ghost" tone="neutral">
              Help
            </Button>
          </Tooltip>
        </AppBar>
        <main style={{ padding: '1rem', minBlockSize: '200vh' }}>
          <Stack gap={4} align="start">
            <Breadcrumbs>
              <BreadcrumbItem href="#">Home</BreadcrumbItem>
              <BreadcrumbItem>Overlays</BreadcrumbItem>
            </Breadcrumbs>
            <button type="button" data-testid="outside">
              Outside
            </button>
            <Dialog
              trigger={<Button>Open dialog</Button>}
              title="Edit profile"
              footer={
                <Button onClick={() => toast({ title: 'Saved from dialog' })}>
                  Toast
                </Button>
              }
            >
              <input aria-label="First field" />
            </Dialog>
            <Dialog trigger={<Button>Open terms</Button>} title="Accept terms">
              <form method="dialog">
                <Button type="submit">I accept</Button>
              </form>
            </Dialog>
            <Drawer
              trigger={<Button>Open drawer</Button>}
              title="Filters"
              placement={{ xs: 'bottom', md: 'end' }}
            >
              Drawer content
            </Drawer>
            <Popover
              trigger={<Button>Open popover</Button>}
              label="Details"
              data-testid="popover"
            >
              Popover content
            </Popover>
            <Menu trigger={<Button>Actions</Button>}>
              <MenuItem onSelect={() => setSelected('rename')}>Rename</MenuItem>
              <MenuItem onSelect={() => setSelected('archive')}>Archive</MenuItem>
              <MenuSeparator />
              <MenuItem tone="negative" onSelect={() => setSelected('delete')}>
                Delete
              </MenuItem>
            </Menu>
            <div
              data-testid="context-area"
              className="p-4 border border-color-border"
              onContextMenu={(event) => {
                event.preventDefault()
                setAt({ top: event.clientY, left: event.clientX })
              }}
            >
              Right-click here
            </div>
            <ContextMenu anchor={at} onClose={() => setAt(null)}>
              <MenuItem onSelect={() => setSelected('copy')}>Copy</MenuItem>
              <MenuItem onSelect={() => setSelected('paste')}>Paste</MenuItem>
            </ContextMenu>
            <Button ref={moveTo} onClick={() => setMoving(true)}>
              Move to…
            </Button>
            <ContextMenu
              anchor={moving ? moveTo.current : null}
              onClose={() => setMoving(false)}
              placement="end"
            >
              <MenuItem onSelect={() => setSelected('inbox')}>Inbox</MenuItem>
              <MenuItem onSelect={() => setSelected('archive')}>Archive</MenuItem>
            </ContextMenu>
            <output data-testid="selected">{selected}</output>
            <Pagination count={10} defaultPage={5} data-testid="pagination" />
          </Stack>
        </main>
        <Toaster />
      </div>
    </SidebarLayout>
  )
}
