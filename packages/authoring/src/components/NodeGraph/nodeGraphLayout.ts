/** A node of a `NodeGraph`: a filter primitive, an audio processor. */
export interface NodeGraphNode {
  /** Unique among the graph's nodes and sources; edges name it. */
  id: string
  /** Its header's text and accessible name. */
  label: string
  /** Its input ports' names, in order: `['in', 'in2']`, or none. */
  inputs: readonly string[]
  /** Whether it has an output that later nodes can read. @default true */
  output?: boolean
  /** Drawn dimmed: the node is in the graph but passes its input through. */
  bypassed?: boolean
}

/** A fixed terminal that feeds nodes, such as `SourceGraphic` or an audio input. */
export interface NodeGraphSource {
  /** Unique among the graph's nodes and sources; edges name it. */
  id: string
  /** Its text, and what a port reads when connected to it. */
  label: string
}

/** A connection: `from`'s output feeds `to`'s input `port`. */
export interface NodeGraphEdge {
  /** The origin: a source's or a node's id. */
  from: string
  /** The node it feeds. */
  to: string
  /** Which of `to`'s inputs it feeds. */
  port: string
}

/**
 * Whether `from` may feed the node at `toIndex`: a source always may, a node
 * only if it comes earlier and has an output. Order is the graph's: a
 * filter's result is only visible to the primitives after it.
 */
const canFeed = (
  nodes: readonly NodeGraphNode[],
  sourceIds: ReadonlySet<string>,
  from: string,
  toIndex: number
): boolean => {
  if (sourceIds.has(from)) return true
  const at = nodes.findIndex((node) => node.id === from)
  return at >= 0 && at < toIndex && nodes[at]!.output !== false
}

/**
 * Each source's and node's column: sources are column 0, and a node sits one
 * column after the furthest of its connected inputs' origins, or in column 1
 * with none. Edges that break the order (from a later node, or to an unknown
 * port) are ignored.
 *
 * ```ts
 * nodeGraphColumns(nodes, edges, sources).get('offset') // 2
 * ```
 */
export const nodeGraphColumns = (
  nodes: readonly NodeGraphNode[],
  edges: readonly NodeGraphEdge[],
  sources: readonly NodeGraphSource[] = []
): Map<string, number> => {
  const columns = new Map<string, number>()
  const sourceIds = new Set(sources.map((source) => source.id))
  for (const source of sources) columns.set(source.id, 0)
  nodes.forEach((node, index) => {
    let column = 1
    for (const edge of edges) {
      if (edge.to !== node.id || !node.inputs.includes(edge.port)) continue
      if (!canFeed(nodes, sourceIds, edge.from, index)) continue
      column = Math.max(column, columns.get(edge.from)! + 1)
    }
    columns.set(node.id, column)
  })
  return columns
}

/**
 * What can feed the node `to`: every source, then every earlier node with an
 * output, in order. A port's menu lists these, and a drop is only taken from
 * one of them.
 */
export const nodeGraphOrigins = (
  nodes: readonly NodeGraphNode[],
  sources: readonly NodeGraphSource[],
  to: string
): (NodeGraphNode | NodeGraphSource)[] => {
  const index = nodes.findIndex((node) => node.id === to)
  if (index < 0) return []
  return [...sources, ...nodes.slice(0, index).filter((node) => node.output !== false)]
}

/** Whether `edge` is one the graph can draw: a valid origin, a known node and port. */
export const isNodeGraphEdge = (
  nodes: readonly NodeGraphNode[],
  sources: readonly NodeGraphSource[],
  edge: NodeGraphEdge
): boolean => {
  const index = nodes.findIndex((node) => node.id === edge.to)
  if (index < 0 || !nodes[index]!.inputs.includes(edge.port)) return false
  return canFeed(nodes, new Set(sources.map((source) => source.id)), edge.from, index)
}
