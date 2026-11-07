import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import {
  isNodeGraphEdge,
  NodeGraph,
  nodeGraphColumns,
  nodeGraphOrigins,
  type NodeGraphEdge,
  type NodeGraphNode,
  type NodeGraphSource,
} from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const sources: NodeGraphSource[] = [
  { id: 'SourceGraphic', label: 'SourceGraphic' },
  { id: 'SourceAlpha', label: 'SourceAlpha' },
]

const nodes: NodeGraphNode[] = [
  { id: 'blur', label: 'feGaussianBlur', inputs: ['in'] },
  { id: 'offset', label: 'feOffset', inputs: ['in'] },
  { id: 'flood', label: 'feFlood', inputs: [] },
  { id: 'merge', label: 'feMerge', inputs: ['in1', 'in2'] },
]

const edges: NodeGraphEdge[] = [
  { from: 'SourceAlpha', to: 'blur', port: 'in' },
  { from: 'blur', to: 'offset', port: 'in' },
  { from: 'offset', to: 'merge', port: 'in1' },
  { from: 'SourceGraphic', to: 'merge', port: 'in2' },
]

describe('nodeGraphColumns', () => {
  it('puts sources first and each node a column past its furthest input', () => {
    const columns = nodeGraphColumns(nodes, edges, sources)
    expect(Object.fromEntries(columns)).toEqual({
      SourceGraphic: 0,
      SourceAlpha: 0,
      blur: 1,
      offset: 2,
      flood: 1,
      merge: 3,
    })
  })

  it('puts an unconnected node in column 1, and ignores edges against the order', () => {
    const columns = nodeGraphColumns(
      nodes,
      [
        // From a later node, to a port the node lacks, from nothing.
        { from: 'merge', to: 'blur', port: 'in' },
        { from: 'blur', to: 'offset', port: 'nope' },
        { from: 'ghost', to: 'merge', port: 'in1' },
      ],
      sources
    )
    expect(columns.get('blur')).toBe(1)
    expect(columns.get('offset')).toBe(1)
    expect(columns.get('merge')).toBe(1)
  })

  it('works with no sources', () => {
    expect(
      Object.fromEntries(
        nodeGraphColumns(nodes, [{ from: 'flood', to: 'merge', port: 'in1' }])
      )
    ).toEqual({ blur: 1, offset: 1, flood: 1, merge: 2 })
  })
})

describe('nodeGraphOrigins and isNodeGraphEdge', () => {
  it('offers sources and earlier nodes with an output', () => {
    const withSink = [
      ...nodes.slice(0, 2),
      { id: 'sink', label: 'Sink', inputs: ['in'], output: false },
      ...nodes.slice(2),
    ]
    expect(nodeGraphOrigins(withSink, sources, 'merge').map((o) => o.id)).toEqual([
      'SourceGraphic',
      'SourceAlpha',
      'blur',
      'offset',
      'flood',
    ])
    expect(nodeGraphOrigins(withSink, sources, 'blur').map((o) => o.id)).toEqual([
      'SourceGraphic',
      'SourceAlpha',
    ])
    expect(nodeGraphOrigins(withSink, sources, 'ghost')).toEqual([])
    expect(
      isNodeGraphEdge(withSink, sources, { from: 'sink', to: 'merge', port: 'in1' })
    ).toBe(false)
    expect(
      isNodeGraphEdge(withSink, sources, { from: 'blur', to: 'merge', port: 'in1' })
    ).toBe(true)
    expect(
      isNodeGraphEdge(withSink, sources, { from: 'merge', to: 'blur', port: 'in' })
    ).toBe(false)
  })
})

interface GraphProps {
  onConnect?: (edge: NodeGraphEdge) => void
  onDisconnect?: (edge: { to: string; port: string }) => void
  onRemove?: (id: string) => void
}

/** A host that applies every change, as an editor would. */
const Graph = ({ onConnect, onDisconnect, onRemove }: GraphProps) => {
  const [graph, setGraph] = useState({ nodes, edges })
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <NodeGraph
      label="Drop shadow"
      sources={sources}
      nodes={graph.nodes}
      edges={graph.edges}
      selected={selected}
      onSelect={setSelected}
      onConnect={(edge) => {
        onConnect?.(edge)
        setGraph((g) => ({
          ...g,
          edges: [
            ...g.edges.filter((e) => e.to !== edge.to || e.port !== edge.port),
            edge,
          ],
        }))
      }}
      onDisconnect={(edge) => {
        onDisconnect?.(edge)
        setGraph((g) => ({
          ...g,
          edges: g.edges.filter((e) => e.to !== edge.to || e.port !== edge.port),
        }))
      }}
      onRemove={(id) => {
        onRemove?.(id)
        setGraph((g) => ({
          nodes: g.nodes.filter((n) => n.id !== id),
          edges: g.edges.filter((e) => e.to !== id && e.from !== id),
        }))
      }}
      renderNode={(node) => <span>{node.id} body</span>}
    />
  )
}

const header = (name: string) => screen.getByRole('button', { name })

describe('NodeGraph', () => {
  const elementFromPoint = document.elementFromPoint
  afterEach(() => {
    document.elementFromPoint = elementFromPoint
  })

  it('is a named group of nodes, each placed in its column and row', async () => {
    const { container } = render(<Graph />)
    expect(screen.getByRole('group', { name: 'Drop shadow' })).toHaveClass(
      'greese-NodeGraph'
    )
    const place = (name: string) => {
      const node = header(name).closest<HTMLElement>('.greese-NodeGraph-node')!
      return [
        node.style.getPropertyValue('--greese-nodegraph-col'),
        node.style.getPropertyValue('--greese-nodegraph-row'),
      ]
    }
    expect(place('feGaussianBlur')).toEqual(['2', '1'])
    expect(place('feFlood')).toEqual(['2', '2'])
    expect(place('feOffset')).toEqual(['3', '1'])
    expect(place('feMerge')).toEqual(['4', '1'])
    expect(screen.getByText('blur body')).toBeInTheDocument()
    expect(container.querySelector('.greese-NodeGraph-edges')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    await expectNoAxeViolations(container)
  })

  it('names each port and its origin', () => {
    render(<Graph />)
    expect(screen.getByRole('button', { name: 'in1: feOffset' })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    )
    expect(screen.getByRole('button', { name: 'in2: SourceGraphic' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'in: SourceAlpha' })).toBeInTheDocument()
  })

  it('has one tab stop, moved by column and row with the arrows', () => {
    render(<Graph />)
    const blur = header('feGaussianBlur')
    expect(blur).toHaveAttribute('tabindex', '0')
    expect(header('feOffset')).toHaveAttribute('tabindex', '-1')

    blur.focus()
    fireEvent.keyDown(blur, { key: 'ArrowDown' })
    expect(header('feFlood')).toHaveFocus()
    expect(header('feFlood')).toHaveAttribute('tabindex', '0')
    expect(blur).toHaveAttribute('tabindex', '-1')
    // Across from row 2 to a column of one: its last row.
    fireEvent.keyDown(header('feFlood'), { key: 'ArrowRight' })
    expect(header('feOffset')).toHaveFocus()
    fireEvent.keyDown(header('feOffset'), { key: 'ArrowRight' })
    expect(header('feMerge')).toHaveFocus()
    // Nothing past the last column, or before the first.
    fireEvent.keyDown(header('feMerge'), { key: 'ArrowRight' })
    expect(header('feMerge')).toHaveFocus()
    fireEvent.keyDown(header('feMerge'), { key: 'Home' })
    expect(blur).toHaveFocus()
    fireEvent.keyDown(blur, { key: 'ArrowLeft' })
    expect(blur).toHaveFocus()
    fireEvent.keyDown(blur, { key: 'ArrowUp' })
    expect(blur).toHaveFocus()
    fireEvent.keyDown(blur, { key: 'End' })
    expect(header('feMerge')).toHaveFocus()
    fireEvent.keyDown(header('feMerge'), { key: 'ArrowLeft' })
    expect(header('feOffset')).toHaveFocus()
  })

  it('puts only the tab stop’s ports in the tab order', () => {
    render(<Graph />)
    expect(screen.getByRole('button', { name: 'in: SourceAlpha' })).toHaveAttribute(
      'tabindex',
      '0'
    )
    expect(screen.getByRole('button', { name: 'in1: feOffset' })).toHaveAttribute(
      'tabindex',
      '-1'
    )
  })

  it('selects a node from its header', () => {
    render(<Graph />)
    const offset = header('feOffset')
    expect(offset).not.toHaveAttribute('aria-current')
    fireEvent.click(offset)
    expect(offset).toHaveAttribute('aria-current', 'true')
    expect(offset.closest('.greese-NodeGraph-node')).toHaveAttribute('data-selected')
    // The selected node holds the tab stop.
    expect(offset).toHaveAttribute('tabindex', '0')
  })

  it('removes a node with Delete or Backspace, and focuses the next', () => {
    const onRemove = vi.fn()
    render(<Graph onRemove={onRemove} />)
    const offset = header('feOffset')
    offset.focus()
    fireEvent.keyDown(offset, { key: 'Delete' })
    expect(onRemove).toHaveBeenCalledWith('offset')
    expect(screen.queryByRole('button', { name: 'feOffset' })).toBeNull()
    expect(header('feFlood')).toHaveFocus()
    // Its reader is left unconnected.
    expect(screen.getByRole('button', { name: 'in1: none' })).toBeInTheDocument()

    fireEvent.keyDown(header('feFlood'), { key: 'Backspace' })
    expect(onRemove).toHaveBeenLastCalledWith('flood')
  })

  it('connects a port from its menu, listing only valid origins', () => {
    const onConnect = vi.fn()
    render(<Graph onConnect={onConnect} />)
    fireEvent.click(screen.getByRole('button', { name: 'in: SourceAlpha' }))
    const menu = screen.getByRole('menu', { name: 'in: SourceAlpha' })
    // Sources only: no node comes before the blur.
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent)
    ).toEqual(['SourceGraphic', 'SourceAlpha', 'Disconnect'])
    expect(within(menu).getByRole('menuitem', { name: 'SourceAlpha' })).toHaveAttribute(
      'aria-current',
      'true'
    )
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'SourceGraphic' }))
    expect(onConnect).toHaveBeenCalledWith({
      from: 'SourceGraphic',
      to: 'blur',
      port: 'in',
    })
    expect(screen.getByRole('button', { name: 'in: SourceGraphic' })).toBeInTheDocument()

    // The merge reads anything before it, never itself.
    fireEvent.click(screen.getByRole('button', { name: 'in2: SourceGraphic' }))
    const merge = screen.getByRole('menu', { name: 'in2: SourceGraphic' })
    expect(
      within(merge)
        .getAllByRole('menuitem')
        .map((item) => item.textContent)
    ).toEqual([
      'SourceGraphic',
      'SourceAlpha',
      'feGaussianBlur',
      'feOffset',
      'feFlood',
      'Disconnect',
    ])
    // Choosing the current origin changes nothing.
    fireEvent.click(within(merge).getByRole('menuitem', { name: 'SourceGraphic' }))
    expect(onConnect).toHaveBeenCalledOnce()
  })

  it('disconnects a port from its menu', () => {
    const onDisconnect = vi.fn()
    render(<Graph onDisconnect={onDisconnect} />)
    fireEvent.click(screen.getByRole('button', { name: 'in: feGaussianBlur' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disconnect' }))
    expect(onDisconnect).toHaveBeenCalledWith({ to: 'offset', port: 'in' })
    const port = screen.getByRole('button', { name: 'in: none' })
    fireEvent.click(port)
    expect(screen.getByRole('menuitem', { name: 'Disconnect' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('marks a bypassed node, and a node with no output has no handle', () => {
    const { container } = render(
      <NodeGraph
        label="Chain"
        nodes={[
          { id: 'a', label: 'Gain', inputs: [], bypassed: true },
          { id: 'b', label: 'Out', inputs: ['in'], output: false },
        ]}
        edges={[{ from: 'a', to: 'b', port: 'in' }]}
      />
    )
    expect(header('Gain (bypassed)').closest('.greese-NodeGraph-node')).toHaveAttribute(
      'data-bypassed'
    )
    expect(container.querySelector('[data-greese-nodegraph-output="a"]')).not.toBeNull()
    expect(container.querySelector('[data-greese-nodegraph-output="b"]')).toBeNull()
  })

  describe('dragging a wire', () => {
    const drag = (from: Element, to: Element | null) => {
      Element.prototype.setPointerCapture ??= () => {}
      Element.prototype.hasPointerCapture ??= () => false
      Element.prototype.releasePointerCapture ??= () => {}
      document.elementFromPoint = vi.fn(() => to)
      fireEvent.pointerDown(from, { button: 0, pointerId: 1, clientX: 0, clientY: 0 })
      fireEvent.pointerUp(from, { pointerId: 1, clientX: 50, clientY: 50 })
    }

    it('connects an output to a later node’s port', () => {
      const onConnect = vi.fn()
      const { container } = render(<Graph onConnect={onConnect} />)
      const output = container.querySelector('[data-greese-nodegraph-output="flood"]')!
      const port = container.querySelector('[data-node="merge"][data-port="in2"]')!
      drag(output, port.querySelector('button'))
      expect(onConnect).toHaveBeenCalledWith({ from: 'flood', to: 'merge', port: 'in2' })
      expect(screen.getByRole('button', { name: 'in2: feFlood' })).toBeInTheDocument()
    })

    it('ignores a drop on an earlier node, its own port, or nowhere', () => {
      const onConnect = vi.fn()
      const { container } = render(<Graph onConnect={onConnect} />)
      const output = container.querySelector('[data-greese-nodegraph-output="offset"]')!
      drag(output, container.querySelector('[data-node="blur"]'))
      drag(output, container.querySelector('[data-node="offset"]'))
      drag(output, null)
      expect(onConnect).not.toHaveBeenCalled()
    })
  })
})
