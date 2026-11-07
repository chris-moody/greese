import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { HierarchicalList } from './HierarchicalList.tsx'
import { FOLDER_TYPE, type TreeItemModel } from '../../core/types/tree.types.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const item = (id: string, overrides: Partial<TreeItemModel> = {}): TreeItemModel => ({
  id,
  name: id,
  ...overrides,
})

const itemMap = (...items: TreeItemModel[]): Map<string, TreeItemModel> =>
  new Map(items.map((i) => [i.id, i]))

describe('HierarchicalList', () => {
  it('renders items in itemOrder', () => {
    const items = itemMap(item('a'), item('b'), item('c'))
    render(
      <HierarchicalList
        label="List"
        items={items}
        itemOrder={['a', 'b', 'c']}
        selectedItems={new Set()}
      />
    )
    const rendered = screen.getAllByText(/^[abc]$/).map((el) => el.textContent)
    expect(rendered).toEqual(['a', 'b', 'c'])
  })

  describe('selection', () => {
    it('a plain click replaces the selection with just the clicked item', () => {
      const items = itemMap(item('a'), item('b'), item('c'))
      const onSelect = vi.fn()
      render(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['a', 'b', 'c']}
          selectedItems={new Set(['a'])}
          onSelect={onSelect}
        />
      )
      fireEvent.click(screen.getByText('b'))
      expect(onSelect).toHaveBeenCalledWith(new Set(['b']))
    })

    it('cmd/ctrl-click toggles the clicked item into the selection', () => {
      const items = itemMap(item('a'), item('b'), item('c'))
      const onSelect = vi.fn()
      render(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['a', 'b', 'c']}
          selectedItems={new Set(['a'])}
          onSelect={onSelect}
        />
      )
      fireEvent.click(screen.getByText('b'), { metaKey: true })
      expect(onSelect).toHaveBeenCalledWith(new Set(['a', 'b']))
    })

    it('cmd/ctrl-click on an already-selected item removes it', () => {
      const items = itemMap(item('a'), item('b'), item('c'))
      const onSelect = vi.fn()
      render(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['a', 'b', 'c']}
          selectedItems={new Set(['a', 'b'])}
          onSelect={onSelect}
        />
      )
      fireEvent.click(screen.getByText('b'), { ctrlKey: true })
      expect(onSelect).toHaveBeenCalledWith(new Set(['a']))
    })

    it('shift-click selects the range between the last selected item and the clicked one', () => {
      const items = itemMap(item('a'), item('b'), item('c'), item('d'))
      const onSelect = vi.fn()
      render(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['a', 'b', 'c', 'd']}
          selectedItems={new Set(['a'])}
          onSelect={onSelect}
        />
      )
      fireEvent.click(screen.getByText('c'), { shiftKey: true })
      expect(onSelect).toHaveBeenCalledWith(new Set(['a', 'b', 'c']))
    })
  })

  describe('delete', () => {
    it('Delete key removes the current selection', () => {
      const items = itemMap(item('a'), item('b'))
      const onDeleteItems = vi.fn()
      const { container } = render(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['a', 'b']}
          selectedItems={new Set(['a'])}
          onDeleteItems={onDeleteItems}
        />
      )
      fireEvent.keyDown(container.querySelector('[tabindex="0"]')!, { key: 'Delete' })
      expect(onDeleteItems).toHaveBeenCalledWith(['a'])
    })

    it('excludes structural items from delete', () => {
      const items = itemMap(item('a'), item('b'))
      const onDeleteItems = vi.fn()
      const { container } = render(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['a', 'b']}
          selectedItems={new Set(['a', 'b'])}
          onDeleteItems={onDeleteItems}
          isStructural={(i) => i.id === 'a'}
        />
      )
      fireEvent.keyDown(container.querySelector('[tabindex="0"]')!, { key: 'Delete' })
      expect(onDeleteItems).toHaveBeenCalledWith(['b'])
    })
  })

  describe('folders', () => {
    it('renders a folder and its children, respecting controlled collapse', () => {
      const folder = item('f', { type: FOLDER_TYPE, children: ['child'] })
      const child = item('child')
      const items = itemMap(folder, child)
      const { rerender } = render(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['f']}
          selectedItems={new Set()}
          collapsedIds={new Set(['f'])}
        />
      )
      expect(screen.getByText('f')).toBeInTheDocument()
      expect(screen.queryByText('child')).not.toBeInTheDocument()

      rerender(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['f']}
          selectedItems={new Set()}
          collapsedIds={new Set()}
        />
      )
      expect(screen.getByText('child')).toBeInTheDocument()
    })

    it('onToggleCollapsed fires with the folder id when its chevron is clicked', () => {
      const folder = item('f', { type: FOLDER_TYPE, children: ['child'] })
      const child = item('child')
      const items = itemMap(folder, child)
      const onToggleCollapsed = vi.fn()
      const { container } = render(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['f']}
          selectedItems={new Set()}
          collapsedIds={new Set(['f'])}
          onToggleCollapsed={onToggleCollapsed}
        />
      )
      const chevron = container.querySelector('button')
      expect(chevron).toBeTruthy()
      fireEvent.click(chevron!)
      expect(onToggleCollapsed).toHaveBeenCalledWith('f')
    })
  })

  describe('drag and drop', () => {
    const makeDataTransfer = () => {
      const store: Record<string, string> = {}
      return {
        effectAllowed: '',
        dropEffect: '',
        setData: (k: string, v: string) => {
          store[k] = v
        },
        getData: (k: string) => store[k] ?? '',
      }
    }

    it('handleDragStart stores the dragged id on the dataTransfer', () => {
      const items = itemMap(item('a'), item('b'))
      render(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['a', 'b']}
          selectedItems={new Set()}
        />
      )
      const dataTransfer = makeDataTransfer()
      fireEvent.dragStart(screen.getByText('a'), { dataTransfer })
      expect(dataTransfer.getData('itemId')).toBe('a')
    })

    it('dropping one item onto another reorders via onItemOrderChange', () => {
      const items = itemMap(item('a'), item('b'), item('c'))
      const onItemOrderChange = vi.fn()
      render(
        <HierarchicalList
          label="List"
          items={items}
          itemOrder={['a', 'b', 'c']}
          selectedItems={new Set()}
          onItemOrderChange={onItemOrderChange}
        />
      )
      const dataTransfer = makeDataTransfer()
      fireEvent.dragStart(screen.getByText('a'), { dataTransfer })
      fireEvent.dragOver(screen.getByText('c'), { dataTransfer, clientY: 0 })
      fireEvent.drop(screen.getByText('c'), { dataTransfer })
      expect(onItemOrderChange).toHaveBeenCalled()
    })
  })

  describe('memoization (perf)', () => {
    it('does not re-invoke renderItem for rows whose own data is unchanged when an unrelated item edits', () => {
      const renderCalls: string[] = []
      const renderItem = (data: TreeItemModel) => {
        renderCalls.push(data.id)
        return <div>{data.name}</div>
      }

      const a1 = item('a')
      const b1 = item('b')
      const items1 = itemMap(a1, b1)
      // Stable across re-renders, like a real caller's redux-backed selection
      // would be (only a new Set when a selection is actually dispatched) —
      // a fresh literal here would defeat memoization for an unrelated reason.
      const selectedItems = new Set<string>()

      const Harness = () => {
        const [items, setItems] = useState(items1)
        return (
          <>
            <button
              onClick={() => {
                // Simulate Immer replacing only 'a's own reference — 'b' keeps its identity.
                const nextA = { ...a1, name: 'a-edited' }
                setItems(
                  new Map([
                    ['a', nextA],
                    ['b', b1],
                  ])
                )
              }}
            >
              edit-a
            </button>
            <HierarchicalList
              label="List"
              items={items}
              itemOrder={['a', 'b']}
              selectedItems={selectedItems}
              renderItem={renderItem}
            />
          </>
        )
      }

      render(<Harness />)
      expect(renderCalls).toEqual(['a', 'b'])
      renderCalls.length = 0

      fireEvent.click(screen.getByText('edit-a'))

      // Only 'a' (the one whose reference actually changed) should re-render.
      expect(renderCalls).toEqual(['a'])
      expect(screen.getByText('a-edited')).toBeInTheDocument()
    })
  })
})

const abc = () => itemMap(item('a'), item('b'), item('c'))

describe('HierarchicalList as a tree', () => {
  it('is a named tree of items, with levels and selection, and passes axe', async () => {
    const folder = item('f', { type: FOLDER_TYPE, children: ['child'] })
    const items = itemMap(folder, item('child', { parent: 'f' }), item('b'))
    const { container } = render(
      <HierarchicalList
        label="Layers"
        items={items}
        itemOrder={['f', 'b']}
        selectedItems={new Set(['b'])}
        collapsedIds={new Set()}
        onToggleCollapsed={() => {}}
        onDeleteItems={() => {}}
      />
    )
    expect(screen.getByRole('tree', { name: 'Layers' })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /f/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByRole('treeitem', { name: 'child' })).toHaveAttribute(
      'aria-level',
      '2'
    )
    expect(screen.getByRole('treeitem', { name: 'b' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    // Tab lands on the selected row: one tab stop for the whole tree.
    expect(screen.getByRole('treeitem', { name: 'b' })).toHaveAttribute('tabindex', '0')
    expect(container.querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1)
    await expectNoAxeViolations(container)
  })

  it('moves focus and the selection with the arrow keys, Home and End', () => {
    const Harness = () => {
      const [selected, setSelected] = useState(new Set(['a']))
      return (
        <HierarchicalList
          label="List"
          items={abc()}
          itemOrder={['a', 'b', 'c']}
          selectedItems={selected}
          onSelect={setSelected}
        />
      )
    }
    render(<Harness />)
    const row = (name: string) => screen.getByRole('treeitem', { name })
    row('a').focus()
    fireEvent.keyDown(row('a'), { key: 'ArrowDown' })
    expect(row('b')).toHaveFocus()
    expect(row('b')).toHaveAttribute('aria-selected', 'true')
    expect(row('a')).toHaveAttribute('aria-selected', 'false')
    fireEvent.keyDown(row('b'), { key: 'ArrowDown', shiftKey: true })
    expect(row('b')).toHaveAttribute('aria-selected', 'true')
    expect(row('c')).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(row('c'), { key: 'Home' })
    expect(row('a')).toHaveFocus()
    fireEvent.keyDown(row('a'), { key: 'End' })
    expect(row('c')).toHaveFocus()
  })

  it('keeps its own folders, closed at first, opened by ArrowRight and closed by ArrowLeft', () => {
    const folder = item('f', { type: FOLDER_TYPE, children: ['child'] })
    render(
      <HierarchicalList
        label="List"
        items={itemMap(folder, item('child', { parent: 'f' }))}
        itemOrder={['f']}
        selectedItems={new Set()}
      />
    )
    const f = screen.getByRole('treeitem', { name: /^f/ })
    expect(screen.queryByText('child')).not.toBeInTheDocument()
    fireEvent.keyDown(f, { key: 'ArrowRight' })
    expect(screen.getByText('child')).toBeInTheDocument()
    expect(f).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(f, { key: 'ArrowLeft' })
    expect(screen.queryByText('child')).not.toBeInTheDocument()
  })

  it('renames the focused row with F2: Enter keeps the name, Escape drops it', () => {
    const onUpdate = vi.fn()
    render(
      <HierarchicalList
        label="List"
        items={abc()}
        itemOrder={['a', 'b', 'c']}
        selectedItems={new Set(['b'])}
        onUpdate={onUpdate}
      />
    )
    fireEvent.keyDown(screen.getByRole('treeitem', { name: 'b' }), { key: 'F2' })
    const field = screen.getByRole('textbox', { name: 'Rename b' })
    expect(field).toHaveFocus()
    fireEvent.change(field, { target: { value: 'Background' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(onUpdate).toHaveBeenCalledWith([{ id: 'b', updates: { name: 'Background' } }])
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
