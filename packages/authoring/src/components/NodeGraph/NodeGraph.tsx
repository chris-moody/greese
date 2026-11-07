'use client'
import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import {
  composeRefs,
  cx,
  Menu,
  MenuItem,
  MenuSeparator,
  VisuallyHidden,
} from '@greese/react'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import {
  isNodeGraphEdge,
  nodeGraphColumns,
  nodeGraphOrigins,
  type NodeGraphEdge,
  type NodeGraphNode,
  type NodeGraphSource,
} from './nodeGraphLayout.ts'

export interface NodeGraphProps extends Omit<ComponentPropsWithRef<'div'>, 'onSelect'> {
  /** The graph's accessible name: it's a `group` of nodes. */
  label: string
  /** The nodes, in order: a node can only read from sources and earlier nodes. */
  nodes: readonly NodeGraphNode[]
  /** Fixed terminals in the first column that any node can read, such as `SourceGraphic`. */
  sources?: readonly NodeGraphSource[]
  /** The connections; one per input port (the last wins), invalid ones are not drawn. */
  edges: readonly NodeGraphEdge[]
  /** The selected node's id: its header is drawn current. */
  selected?: string | null
  /** Called with a node's id when its header is clicked, or Enter or Space is pressed on it. */
  onSelect?: (id: string) => void
  /** Called when a port is given an origin, from its menu or by dragging an output to it. */
  onConnect?: (edge: NodeGraphEdge) => void
  /** Called when a port's menu clears its input. */
  onDisconnect?: (edge: { to: string; port: string }) => void
  /** Called with a node's id when Delete or Backspace is pressed on its header. */
  onRemove?: (id: string) => void
  /** A body under a node's header and ports: its parameters, a bypass switch. */
  renderNode?: (node: NodeGraphNode) => ReactNode
  /**
   * How nodes are placed: `graph` in columns by depth from the sources.
   * (`chain`, one column with implicit edges, is reserved: ADR 0039.)
   * @default 'graph'
   */
  layout?: 'graph'
}

interface Drawing {
  width: number
  height: number
  wires: { key: string; d: string }[]
}

const EMPTY: Drawing = { width: 0, height: 0, wires: [] }
// One array for every graph without sources, so the effects keyed on them stay put.
const NO_SOURCES: readonly NodeGraphSource[] = []

/** A wire from an output (x1, y1) to an input (x2, y2), leaving and arriving level. */
const wire = (x1: number, y1: number, x2: number, y2: number): string => {
  const bend = Math.max(24, Math.abs(x2 - x1) / 2)
  return `M ${x1} ${y1} C ${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}`
}

/** Where an element's edge is, in the graph's scrolled coordinates. */
const anchor = (root: HTMLElement, el: Element, side: 'start' | 'end') => {
  const box = root.getBoundingClientRect()
  const rect = el.getBoundingClientRect()
  return {
    x: (side === 'end' ? rect.right : rect.left) - box.left + root.scrollLeft,
    y: rect.top + rect.height / 2 - box.top + root.scrollTop,
  }
}

/**
 * Reads the wires from the DOM: each port names its origin (`data-from`), and
 * each origin marks its output. Drawing geometry, measured after layout; the
 * nodes themselves are placed by CSS.
 */
const measure = (root: HTMLElement): Drawing => {
  const wires: Drawing['wires'] = []
  for (const port of root.querySelectorAll<HTMLElement>('[data-greese-nodegraph-port]')) {
    const from = port.dataset.from
    const output =
      from && root.querySelector(`[data-greese-nodegraph-output="${CSS.escape(from)}"]`)
    if (!output) continue
    const a = anchor(root, output, 'end')
    const b = anchor(root, port, 'start')
    wires.push({
      key: `${port.dataset.node}:${port.dataset.port}`,
      d: wire(a.x, a.y, b.x, b.y),
    })
  }
  return { width: root.scrollWidth, height: root.scrollHeight, wires }
}

const same = (a: Drawing, b: Drawing) =>
  a.width === b.width &&
  a.height === b.height &&
  a.wires.length === b.wires.length &&
  a.wires.every((w, i) => w.key === b.wires[i]!.key && w.d === b.wires[i]!.d)

/**
 * A graph of nodes, their input ports and the edges between them: an SVG
 * filter's primitives, an audio chain. It's controlled and owns no document:
 * it reports each change, and the host applies it (ADR 0039).
 *
 * Nodes sit in columns by depth from the sources, in their given order. Each
 * node's header is a button in one roving tab stop (the arrows move by column
 * and row, Enter selects, Delete removes); each input port is a menu button
 * naming its origin, which lists what can feed it. With a pointer, drag from
 * an output's handle to a port.
 *
 * ```tsx
 * <NodeGraph
 *   label="Drop shadow"
 *   sources={[{ id: 'SourceAlpha', label: 'SourceAlpha' }]}
 *   nodes={[{ id: 'blur', label: 'feGaussianBlur', inputs: ['in'] }]}
 *   edges={[{ from: 'SourceAlpha', to: 'blur', port: 'in' }]}
 *   selected={selected}
 *   onSelect={setSelected}
 *   onConnect={connect}
 * />
 * ```
 */
export const NodeGraph = ({
  label,
  nodes,
  sources = NO_SOURCES,
  edges,
  selected = null,
  onSelect,
  onConnect,
  onDisconnect,
  onRemove,
  renderNode,
  layout: _layout = 'graph',
  className,
  ref,
  ...props
}: NodeGraphProps): JSX.Element => {
  const root = useRef<HTMLDivElement>(null)
  const headers = useRef(new Map<string, HTMLButtonElement>())
  const [focused, setFocused] = useState<string>()
  const [drawing, setDrawing] = useState<Drawing>(EMPTY)
  const [drag, setDrag] = useState<{ from: string; d: string } | null>(null)
  // The removed node's place, so focus can land on its neighbour once the
  // host has taken it out.
  const removing = useRef<{ id: string; index: number } | null>(null)

  const columns = nodeGraphColumns(nodes, edges, sources)
  const byColumn: string[][] = []
  for (const node of nodes) (byColumn[columns.get(node.id)!] ??= []).push(node.id)
  const rowOf = new Map<string, number>()
  sources.forEach((source, row) => rowOf.set(source.id, row))
  for (const column of byColumn) column?.forEach((id, row) => rowOf.set(id, row))

  const labels = new Map<string, string>()
  for (const item of [...sources, ...nodes]) labels.set(item.id, item.label)
  const originOf = new Map<string, string>()
  for (const edge of edges) {
    if (isNodeGraphEdge(nodes, sources, edge))
      originOf.set(`${edge.to}\n${edge.port}`, edge.from)
  }

  const stop =
    (focused && nodes.some((node) => node.id === focused) && focused) ||
    (selected && nodes.some((node) => node.id === selected) && selected) ||
    nodes[0]?.id

  // Edges are drawn from the laid-out DOM: when the graph changes, and when
  // anything resizes (a node's body, the panel).
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const next = measure(el)
    setDrawing((prev) => (same(prev, next) ? prev : next))

    const gone = removing.current
    if (gone && !nodes.some((node) => node.id === gone.id)) {
      const next = nodes[Math.min(gone.index, nodes.length - 1)]
      if (next) headers.current.get(next.id)?.focus()
    }
    removing.current = null
  }, [nodes, sources, edges])

  useLayoutEffect(() => {
    const el = root.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const next = measure(el)
      setDrawing((prev) => (same(prev, next) ? prev : next))
    })
    observer.observe(el)
    for (const item of el.querySelectorAll('[data-greese-nodegraph-item]')) {
      observer.observe(item)
    }
    return () => observer.disconnect()
  }, [nodes, sources])

  const focusNode = (id: string | undefined) => {
    if (id) headers.current.get(id)?.focus()
  }

  const onHeaderKey = (event: KeyboardEvent<HTMLButtonElement>, node: NodeGraphNode) => {
    const column = columns.get(node.id)!
    const row = rowOf.get(node.id)!
    const across = (step: number) => {
      const ids = byColumn[column + step]
      return ids?.[Math.min(row, ids.length - 1)]
    }
    let next: string | undefined
    switch (event.key) {
      case 'ArrowUp':
        next = byColumn[column]![row - 1]
        break
      case 'ArrowDown':
        next = byColumn[column]![row + 1]
        break
      case 'ArrowLeft':
        next = across(-1)
        break
      case 'ArrowRight':
        next = across(1)
        break
      case 'Home':
        next = nodes[0]?.id
        break
      case 'End':
        next = nodes.at(-1)?.id
        break
      case 'Delete':
      case 'Backspace':
        if (!onRemove) return
        event.preventDefault()
        removing.current = { id: node.id, index: nodes.indexOf(node) }
        onRemove(node.id)
        return
      default:
        return
    }
    event.preventDefault()
    focusNode(next)
  }

  const connect = (edge: NodeGraphEdge) => {
    if (originOf.get(`${edge.to}\n${edge.port}`) === edge.from) return
    if (isNodeGraphEdge(nodes, sources, edge)) onConnect?.(edge)
  }

  // The output handle is pointer-only: every connection can also be made
  // from its port's menu, so the handle is hidden from assistive tech.
  const startWire = (event: PointerEvent<HTMLSpanElement>, from: string) => {
    const el = root.current
    if (event.button !== 0 || !el || !onConnect) return
    event.preventDefault()
    const start = anchor(el, event.currentTarget, 'end')
    const at = (clientX: number, clientY: number) => {
      const box = el.getBoundingClientRect()
      return wire(
        start.x,
        start.y,
        clientX - box.left + el.scrollLeft,
        clientY - box.top + el.scrollTop
      )
    }
    setDrag({ from, d: at(event.clientX, event.clientY) })
    beginPointerDrag(event, {
      captureTarget: event.currentTarget,
      suppressUserSelect: true,
      rafThrottle: true,
      onMove: (_e, { clientX, clientY }) => setDrag({ from, d: at(clientX, clientY) }),
      onEnd: (_e, { clientX, clientY }) => {
        setDrag(null)
        const port = document
          .elementFromPoint(clientX, clientY)
          ?.closest<HTMLElement>('[data-greese-nodegraph-port]')
        if (!port || !el.contains(port)) return
        connect({ from, to: port.dataset.node!, port: port.dataset.port! })
      },
    })
  }

  const handle = (id: string) => (
    <span
      aria-hidden="true"
      className="greese-NodeGraph-output"
      data-greese-nodegraph-output={id}
      onPointerDown={(event) => startWire(event, id)}
    />
  )

  const place = (id: string): CSSProperties =>
    ({
      '--greese-nodegraph-col': columns.get(id)! + 1,
      '--greese-nodegraph-row': rowOf.get(id)! + 1,
    }) as CSSProperties

  return (
    <div
      {...props}
      ref={composeRefs<HTMLDivElement>(root, ref)}
      role="group"
      aria-label={label}
      className={cx('greese-NodeGraph', className)}
      data-connecting={drag ? '' : undefined}
    >
      {/* eslint-disable-next-line no-restricted-syntax -- the graph's edges, not an icon */}
      <svg
        aria-hidden="true"
        className="greese-NodeGraph-edges"
        width={drawing.width}
        height={drawing.height}
      >
        {drawing.wires.map((w) => (
          <path key={w.key} className="greese-NodeGraph-edge" d={w.d} />
        ))}
        {drag && (
          <path
            className="greese-NodeGraph-edge greese-NodeGraph-edge--pending"
            d={drag.d}
          />
        )}
      </svg>
      {sources.map((source) => (
        <div
          key={source.id}
          className="greese-NodeGraph-source"
          data-greese-nodegraph-item=""
          style={place(source.id)}
        >
          {source.label}
          {handle(source.id)}
        </div>
      ))}
      {nodes.map((node) => {
        const current = node.id === selected
        const tabIndex = node.id === stop ? 0 : -1
        const origins = nodeGraphOrigins(nodes, sources, node.id)
        return (
          <div
            key={node.id}
            className="greese-NodeGraph-node"
            // Named, so a port ("in: SourceGraphic") is heard with its node.
            role="group"
            aria-label={node.label}
            data-greese-nodegraph-item=""
            data-selected={current ? '' : undefined}
            data-bypassed={node.bypassed ? '' : undefined}
            style={place(node.id)}
            onFocus={() => setFocused(node.id)}
          >
            <button
              ref={(el) => {
                if (el) headers.current.set(node.id, el)
                else headers.current.delete(node.id)
              }}
              type="button"
              className="greese-NodeGraph-header"
              tabIndex={tabIndex}
              aria-current={current || undefined}
              onClick={() => onSelect?.(node.id)}
              onKeyDown={(event) => onHeaderKey(event, node)}
            >
              {node.label}
              {node.bypassed && (
                <>
                  {' '}
                  <VisuallyHidden>(bypassed)</VisuallyHidden>
                </>
              )}
            </button>
            {node.output !== false && handle(node.id)}
            {node.inputs.map((port) => {
              const from = originOf.get(`${node.id}\n${port}`)
              const droppable =
                drag && drag.from !== from && origins.some((o) => o.id === drag.from)
              return (
                <div
                  key={port}
                  className="greese-NodeGraph-port"
                  data-greese-nodegraph-port=""
                  data-node={node.id}
                  data-port={port}
                  data-from={from}
                  data-droppable={droppable ? '' : undefined}
                >
                  <Menu
                    trigger={
                      <button
                        type="button"
                        className="greese-NodeGraph-portButton"
                        tabIndex={tabIndex}
                      >
                        {port}: {from ? labels.get(from) : 'none'}
                      </button>
                    }
                  >
                    {origins.map((origin) => (
                      <MenuItem
                        key={origin.id}
                        aria-current={origin.id === from || undefined}
                        onSelect={() => connect({ from: origin.id, to: node.id, port })}
                      >
                        {origin.label}
                      </MenuItem>
                    ))}
                    <MenuSeparator />
                    <MenuItem
                      disabled={!from}
                      onSelect={() => onDisconnect?.({ to: node.id, port })}
                    >
                      Disconnect
                    </MenuItem>
                  </Menu>
                </div>
              )
            })}
            {renderNode && (
              <div className="greese-NodeGraph-body">{renderNode(node)}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
