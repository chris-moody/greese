import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../test/axe.ts'
import { functionProps } from '../test/serverProps.ts'
import { computeFallbackPosition, positionArea } from '../utils/anchor.ts'
import { AppBar } from './AppBar/AppBar.tsx'
import { BreadcrumbItem } from './Breadcrumbs/BreadcrumbItem.tsx'
import { Breadcrumbs } from './Breadcrumbs/Breadcrumbs.tsx'
import { Button } from './Button/Button.tsx'
import { Dialog, Drawer } from './Dialog/Dialog.tsx'
import { Menu, MenuItem, MenuSeparator } from './Menu/Menu.tsx'
import { Pagination, paginationRange } from './Pagination/Pagination.tsx'
import { Popover } from './Popover/Popover.tsx'
import { currentSection, ScrollSpy } from './ScrollSpy/ScrollSpy.tsx'
import { Slot } from './Slot/Slot.tsx'
import { Sidebar, SidebarLayout, SidebarTrigger } from './Sidebar/Sidebar.tsx'
import { toast, Toaster } from './Toast/Toast.tsx'
import { Tooltip } from './Tooltip/Tooltip.tsx'

describe('anchor fallback positioning', () => {
  const viewport = { width: 1000, height: 800 }
  const anchor = { top: 100, left: 200, width: 100, height: 40 }
  const floating = { width: 160, height: 120 }

  it('maps placements to logical position-area values', () => {
    expect(positionArea['bottom-start']).toBe('block-end span-inline-end')
    expect(positionArea.end).toBe('inline-end')
  })

  it('places below and start-aligned', () => {
    expect(
      computeFallbackPosition(anchor, floating, viewport, 'bottom-start', 6)
    ).toEqual({
      top: 146,
      left: 200,
    })
  })

  it('aligns end and centre', () => {
    expect(
      computeFallbackPosition(anchor, floating, viewport, 'bottom-end', 6).left
    ).toBe(140)
    // No room above (100 - 120 - 6 < 6), so 'top' flips below the anchor.
    expect(computeFallbackPosition(anchor, floating, viewport, 'top', 6)).toEqual({
      top: 146,
      left: 170,
    })
  })

  it('flips to the other side when it would overflow, like flip-block', () => {
    const low = { ...anchor, top: 700 }
    expect(computeFallbackPosition(low, floating, viewport, 'bottom', 6).top).toBe(574)
  })

  it('clamps inside the viewport', () => {
    const edge = { ...anchor, left: 950 }
    expect(
      computeFallbackPosition(edge, floating, viewport, 'bottom-start', 6).left
    ).toBe(834)
  })

  it('places beside, flipping inline and following RTL', () => {
    expect(computeFallbackPosition(anchor, floating, viewport, 'end', 6).left).toBe(306)
    expect(computeFallbackPosition(anchor, floating, viewport, 'end', 6, true).left).toBe(
      34
    )
    const right = { ...anchor, left: 900 }
    expect(computeFallbackPosition(right, floating, viewport, 'end', 6).left).toBe(734)
    expect(
      computeFallbackPosition(anchor, floating, viewport, 'bottom-start', 6, true).left
    ).toBe(140)
  })
})

describe('Dialog and Drawer', () => {
  it('opens from its trigger, is named by its title, and closes', async () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog
        trigger={<Button>Delete</Button>}
        title="Delete project?"
        description="This can't be undone."
        footer={<Button>Confirm</Button>}
        onOpenChange={onOpenChange}
      >
        Body
      </Dialog>
    )
    const trigger = screen.getByRole('button', { name: 'Delete' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    await userEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Delete project?' })
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAccessibleDescription("This can't be undone.")
    expect(dialog).toHaveAttribute('closedby', 'any')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(dialog).not.toHaveAttribute('open')
    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
    // Focus left stranded in the closed dialog goes back to the trigger.
    expect(trigger).toHaveFocus()
  })

  it('syncs when the browser closes it (Escape, closedby, form method=dialog)', () => {
    const { rerender } = render(<Dialog open title="T" onOpenChange={() => {}} />)
    const dialog = screen.getByRole('dialog', { hidden: true }) as HTMLDialogElement
    expect(dialog.open).toBe(true)
    rerender(<Dialog open={false} title="T" onOpenChange={() => {}} />)
    expect(dialog.open).toBe(false)
  })

  it('can always be dismissed: a close button, closedby any, Escape not cancelled', () => {
    render(<Dialog defaultOpen title="Accept terms" />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('closedby', 'any')
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    const cancel = new Event('cancel', { cancelable: true })
    dialog.dispatchEvent(cancel)
    expect(cancel.defaultPrevented).toBe(false)
  })

  it('Drawer has no axe violations while open', async () => {
    const { container } = render(
      <Drawer defaultOpen title="Filters">
        <p>Body</p>
      </Drawer>
    )
    await expectNoAxeViolations(container)
  })

  it('Drawer resolves a responsive placement', () => {
    render(<Drawer defaultOpen title="Filters" placement={{ xs: 'bottom', md: 'end' }} />)
    expect(screen.getByRole('dialog')).toHaveClass(
      'greese-Dialog',
      'greese-Drawer',
      'greese-Drawer--xs-placement-bottom',
      'greese-Drawer--md-placement-end'
    )
  })
})

describe('Popover and Tooltip', () => {
  it('Popover has no axe violations while open', async () => {
    const { container } = render(
      <Popover trigger={<Button>Filters</Button>} label="Filter options" defaultOpen>
        <p>Content</p>
      </Popover>
    )
    await expectNoAxeViolations(container)
  })

  it('Popover wires its trigger to a native popover and tracks state', async () => {
    const onOpenChange = vi.fn()
    render(
      <Popover
        trigger={<Button>Filters</Button>}
        label="Filter options"
        onOpenChange={onOpenChange}
      >
        Content
      </Popover>
    )
    const trigger = screen.getByRole('button', { name: 'Filters' })
    // Closed popovers are hidden, so (as in browsers) they have no computed name yet.
    const popover = screen.getByRole('dialog', { hidden: true })
    expect(popover).toHaveAttribute('aria-label', 'Filter options')
    expect(trigger).toHaveAttribute('popovertarget', popover.id)
    expect(popover).toHaveAttribute('popover', 'auto')
    expect(
      trigger.style.getPropertyValue('anchor-name') || trigger.getAttribute('style')
    ).toContain('--greese-anchor-')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
  })

  it('Tooltip describes its trigger and shows on keyboard focus', async () => {
    render(
      <Tooltip content="Copies the link">
        <Button>Share</Button>
      </Tooltip>
    )
    const tip = screen.getByRole('tooltip', { hidden: true })
    const trigger = screen.getByRole('button', { name: 'Share' })
    expect(trigger).toHaveAccessibleDescription('Copies the link')
    vi.useFakeTimers()
    try {
      fireEvent.focus(trigger)
      // jsdom never matches :focus-visible, so focus alone does not show it.
      act(() => vi.runAllTimers())
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      act(() => vi.advanceTimersByTime(400))
      expect(tip.matches(':popover-open')).toBe(true)
      fireEvent.keyDown(document, { key: 'Escape' })
      act(() => vi.runAllTimers())
      expect(tip.matches(':popover-open')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('Menu', () => {
  const Example = ({ onSelect = vi.fn() }: { onSelect?: (action: string) => void }) => (
    <Menu trigger={<Button>Actions</Button>}>
      <MenuItem onSelect={() => onSelect('rename')}>Rename</MenuItem>
      <MenuItem disabled>Duplicate</MenuItem>
      <MenuItem onSelect={() => onSelect('archive')}>Archive</MenuItem>
      <MenuSeparator />
      <MenuItem tone="negative" onSelect={() => onSelect('delete')}>
        Delete
      </MenuItem>
    </Menu>
  )

  it('has no axe violations while open, separator included', async () => {
    const { container } = render(<Example />)
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    await expectNoAxeViolations(container)
  })

  it('gives an item its tone, brand colors included', () => {
    render(
      <Menu trigger={<Button>Actions</Button>}>
        <MenuItem>Rename</MenuItem>
        <MenuItem tone="primary">Publish</MenuItem>
        <MenuItem tone="negative">Delete</MenuItem>
      </Menu>
    )
    const [rename, publish, remove] = screen.getAllByRole('menuitem', { hidden: true })
    expect(rename!.className).toBe('greese-MenuItem')
    expect(publish).toHaveClass('greese-MenuItem--primary')
    expect(remove).toHaveClass('greese-MenuItem--negative')
  })

  it('is a labelled menu button', () => {
    render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('menu', { hidden: true })).toHaveAttribute(
      'aria-labelledby',
      trigger.id
    )
  })

  it('opens with ArrowDown on the first item, ArrowUp on the last', async () => {
    render(<Example />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'Rename', hidden: true })).toHaveFocus()
    act(() => screen.getByRole('menu', { hidden: true }).hidePopover())
    trigger.focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Delete', hidden: true })).toHaveFocus()
  })

  it('moves with arrows, skips disabled items, wraps, and supports type-ahead', async () => {
    render(<Example />)
    screen.getByRole('button', { name: 'Actions' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    const item = (name: string) => screen.getByRole('menuitem', { name, hidden: true })
    await userEvent.keyboard('{ArrowDown}')
    expect(item('Archive')).toHaveFocus()
    await userEvent.keyboard('{End}{ArrowDown}')
    expect(item('Rename')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(item('Delete')).toHaveFocus()
    await userEvent.keyboard('a')
    expect(item('Archive')).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(item('Rename')).toHaveFocus()
  })

  it('selects with Enter, then closes; disabled items do nothing', async () => {
    const onSelect = vi.fn()
    render(<Example onSelect={onSelect} />)
    screen.getByRole('button', { name: 'Actions' }).focus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith('archive')
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Duplicate', hidden: true })
    )
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})

describe('Toast', () => {
  // Toast text also appears in the live regions, so query inside the list.
  const list = () => within(document.querySelector<HTMLElement>('.greese-Toaster-list')!)

  afterEach(() => {
    act(() => toast.dismiss())
    vi.useRealTimers()
  })

  it('shows toasts from anywhere and announces them politely', () => {
    render(<Toaster />)
    act(() => {
      toast({ title: 'Saved', description: 'All changes stored.' })
    })
    expect(list().getByText('Saved')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Notifications', hidden: true })
    ).toBeInTheDocument()
    const polite = document.querySelector('[aria-live="polite"]')!
    expect(polite).toHaveTextContent('Saved. All changes stored.')
  })

  it('announces negative toasts assertively and runs the action', async () => {
    const onClick = vi.fn()
    render(<Toaster />)
    act(() => {
      toast({
        title: "Couldn't sync",
        tone: 'negative',
        action: { label: 'Retry', onClick },
      })
    })
    expect(document.querySelector('[aria-live="assertive"]')).toHaveTextContent(
      "Couldn't sync"
    )
    await userEvent.click(list().getByRole('button', { name: 'Retry' }))
    expect(onClick).toHaveBeenCalled()
    expect(list().queryByText("Couldn't sync")).toBeNull()
  })

  it('auto-dismisses, pausing while hovered', () => {
    vi.useFakeTimers()
    render(<Toaster />)
    act(() => {
      toast({ title: 'Brief', duration: 1000 })
    })
    const item = list().getByText('Brief').closest('li')!
    fireEvent.pointerEnter(item)
    act(() => vi.advanceTimersByTime(5000))
    expect(list().getByText('Brief')).toBeInTheDocument()
    fireEvent.pointerLeave(item)
    act(() => vi.advanceTimersByTime(1000))
    expect(list().queryByText('Brief')).toBeNull()
  })

  it('caps how many are visible and dismisses by id', () => {
    render(<Toaster max={2} />)
    let first = 0
    act(() => {
      first = toast({ title: 'One', duration: Infinity })
      toast({ title: 'Two', duration: Infinity })
      toast({ title: 'Three', duration: Infinity })
    })
    expect(list().queryByText('Three')).toBeNull()
    act(() => toast.dismiss(first))
    expect(list().getByText('Three')).toBeInTheDocument()
  })
})

describe('navigation', () => {
  it('Sidebar and its trigger share an id; a link inside closes it', async () => {
    render(
      <SidebarLayout breakpoint="lg">
        <Sidebar label="Main">
          <a href="#home">Home</a>
        </Sidebar>
        <main>
          <SidebarTrigger />
        </main>
      </SidebarLayout>
    )
    const trigger = screen.getByRole('button', { name: 'Open navigation' })
    const sidebar = screen.getByRole('complementary', { hidden: true })
    expect(sidebar).toHaveAttribute('aria-label', 'Main')
    expect(trigger).toHaveAttribute('popovertarget', sidebar.id)
    expect(trigger).toHaveClass('greese-SidebarTrigger--lg')
    await userEvent.click(trigger)
    expect(sidebar.matches(':popover-open')).toBe(true)
    await userEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(sidebar.matches(':popover-open')).toBe(false)
  })

  it('AppBar is a sticky, elevating header by default', () => {
    render(<AppBar data-testid="bar" />)
    expect(screen.getByTestId('bar').tagName).toBe('HEADER')
    expect(screen.getByTestId('bar')).toHaveClass(
      'greese-AppBar--sticky',
      'greese-AppBar--elevate'
    )
  })

  it('Breadcrumbs mark the current page and collapse the middle', async () => {
    render(
      <Breadcrumbs maxItems={3}>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/a">Projects</BreadcrumbItem>
        <BreadcrumbItem href="/a/b">Greese</BreadcrumbItem>
        <BreadcrumbItem href="/a/b/c">Settings</BreadcrumbItem>
        <BreadcrumbItem>Members</BreadcrumbItem>
      </Breadcrumbs>
    )
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav.querySelectorAll('li')).toHaveLength(4)
    expect(screen.getByText('Members')).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByText('Projects')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Show full path' }))
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument()
  })

  it('BreadcrumbItem is a Server Component, router links included', () => {
    const server = [BreadcrumbItem, Slot] as unknown as Parameters<
      typeof functionProps
    >[1]
    expect(
      functionProps(
        <>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem asChild>
            <a href="/docs">Docs</a>
          </BreadcrumbItem>
          <BreadcrumbItem>Here</BreadcrumbItem>
        </>,
        server
      )
    ).toEqual([])
  })

  it.each([
    [1, 5, [1, 2, 3, 4, 5]],
    [1, 10, [1, 2, 3, 4, 5, 'ellipsis-end', 10]],
    [5, 10, [1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 10]],
    [10, 10, [1, 'ellipsis-start', 6, 7, 8, 9, 10]],
    [4, 10, [1, 2, 3, 4, 5, 'ellipsis-end', 10]],
    [7, 10, [1, 'ellipsis-start', 6, 7, 8, 9, 10]],
  ])('paginationRange(page %i of %i)', (page, count, expected) => {
    expect(paginationRange(page, count)).toEqual(expected)
  })

  it('paginationRange honours siblings and boundaries', () => {
    expect(paginationRange(10, 20, 2, 2)).toEqual([
      1,
      2,
      'ellipsis-start',
      8,
      9,
      10,
      11,
      12,
      'ellipsis-end',
      19,
      20,
    ])
  })

  it('Pagination marks the current page and steps', async () => {
    const onPageChange = vi.fn()
    render(<Pagination count={10} defaultPage={1} onPageChange={onPageChange} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('Pagination renders crawlable links with getHref', () => {
    render(<Pagination count={3} page={2} getHref={(p) => `?page=${p}`} />)
    expect(screen.getByRole('link', { name: 'Page 3' })).toHaveAttribute(
      'href',
      '?page=3'
    )
    expect(screen.getByRole('link', { name: 'Previous page' })).toHaveAttribute(
      'href',
      '?page=1'
    )
  })

  it('Pagination links for a given page are a Server Component; others keep state on the client', () => {
    const server = [Pagination, Button, Slot] as unknown as Parameters<
      typeof functionProps
    >[1]
    const getHref = (p: number) => `?page=${p}`
    expect(
      functionProps(
        <Pagination
          count={9}
          page={4}
          getHref={getHref}
          labels={{ page: (n) => `${n}` }}
        />,
        server
      )
    ).toEqual([])
    // Without `page`, links track their own page, as before: a client component.
    expect(functionProps(<Pagination count={9} getHref={getHref} />, server)).toContain(
      '<PaginationState> getHref'
    )
  })

  it('Pagination links for a given page still report presses', async () => {
    const onPageChange = vi.fn()
    render(
      <Pagination count={3} page={1} getHref={() => '#'} onPageChange={onPageChange} />
    )
    await userEvent.click(screen.getByRole('link', { name: 'Page 2' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
    // Controlled: the page moves when the parent passes the new one.
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })
})

describe('Phase 5 accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <SidebarLayout>
        <Sidebar label="Main">
          <a href="#a">A</a>
        </Sidebar>
        <div>
          <AppBar>
            <SidebarTrigger />
            <Menu trigger={<Button>Actions</Button>}>
              <MenuItem>Rename</MenuItem>
            </Menu>
            <Tooltip content="Help text">
              <Button>Help</Button>
            </Tooltip>
          </AppBar>
          <main>
            <Breadcrumbs>
              <BreadcrumbItem href="/">Home</BreadcrumbItem>
              <BreadcrumbItem>Here</BreadcrumbItem>
            </Breadcrumbs>
            <Pagination count={5} />
            <Dialog trigger={<Button>Open</Button>} title="Title" />
          </main>
          <Toaster />
        </div>
      </SidebarLayout>
    )
    await expectNoAxeViolations(container)
  })
})

describe('ScrollSpy', () => {
  it('picks the last section above the line, and the last at the end of the page', () => {
    const sections = [
      { id: 'b', top: 300 },
      { id: 'a', top: -500 },
      { id: 'c', top: 900 },
    ]
    expect(currentSection(sections, 100)).toBe('a')
    expect(currentSection(sections, 300)).toBe('b')
    expect(currentSection([{ id: 'a', top: 200 }], 100)).toBeUndefined()
    expect(currentSection(sections, 100, true)).toBe('c')
    expect(currentSection([], 100, true)).toBeUndefined()
  })

  it('marks the link to the current section, and only same-page links', async () => {
    const onActiveChange = vi.fn()
    const place = (id: string, top: number) => {
      const el = document.createElement('section')
      el.id = id
      el.getBoundingClientRect = () => ({ top }) as DOMRect
      document.body.append(el)
      return el
    }
    const placed = [place('install', -200), place('usage', 600)]
    const { container, unmount } = render(
      <ScrollSpy asChild offset={80} onActiveChange={onActiveChange}>
        <nav aria-label="Sections">
          <a href="#install">Install</a>
          <a href="#usage">Usage</a>
          <a href="/elsewhere#install">Elsewhere</a>
        </nav>
      </ScrollSpy>
    )
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('greese-ScrollSpy')
    expect(screen.getByRole('link', { name: 'Install' })).toHaveAttribute(
      'aria-current',
      'location'
    )
    expect(screen.getByRole('link', { name: 'Usage' })).not.toHaveAttribute(
      'aria-current'
    )
    expect(screen.getByRole('link', { name: 'Elsewhere' })).not.toHaveAttribute(
      'aria-current'
    )
    expect(onActiveChange).toHaveBeenLastCalledWith('install')
    await expectNoAxeViolations(container)
    unmount()
    placed.forEach((el) => el.remove())
  })
})
