import { uid } from './uid.ts'
import {
  PanelArea,
  RESERVED_STAGE_ID,
  RESERVED_TIMELINE_ID,
  type LayoutSpec,
  type LayoutSpecChild,
  type PanelSlot,
  type ZoneLeaf,
  type ZoneNode,
  type ZoneSplit,
  type ZoneTree,
} from './layoutTree.types.ts'

export const EMPTY_TREE: ZoneTree = { rootId: null, nodes: {} }

/** A stage or timeline leaf, with its fixed id. */
export function makeReservedLeaf(id: string): ZoneLeaf {
  return { kind: 'leaf', id, tabs: [], activeTab: '', collapsed: false }
}

export function makeLeaf(
  tabs: string[],
  activeTab?: string,
  collapsed = false,
  headless = false
): ZoneLeaf {
  return {
    kind: 'leaf',
    id: uid(),
    tabs,
    activeTab: activeTab ?? tabs[0] ?? '',
    collapsed,
    ...(headless ? { headless } : {}),
  }
}

export function makeSplit(
  orientation: 'col' | 'row',
  firstId: string,
  secondId: string,
  primarySize = 180
): ZoneSplit {
  return {
    kind: 'split',
    id: uid(),
    orientation,
    children: [firstId, secondId],
    primarySize,
  }
}

export interface BuildDefaultTreeOptions {
  /** Include a timeline leaf above everything. */
  hasTimeline?: boolean
}

/**
 * A workspace from panels' default areas, for an editor with no
 * {@link LayoutSpec}: `[left panels 220px | stage | right panels 220px]`,
 * with the timeline above when asked for. Each side's panels stack in order.
 */
export function buildDefaultTree(
  panels: readonly PanelSlot[],
  options: BuildDefaultTreeOptions = {}
): ZoneTree {
  const byOrder = (a: PanelSlot, b: PanelSlot) => (a.order ?? 0) - (b.order ?? 0)
  const left = panels.filter((p) => p.area === PanelArea.LEFT).sort(byOrder)
  const right = panels.filter((p) => p.area === PanelArea.RIGHT).sort(byOrder)

  const nodes: Record<string, ZoneNode> = {}
  nodes[RESERVED_STAGE_ID] = makeReservedLeaf(RESERVED_STAGE_ID)

  const column = (list: readonly PanelSlot[]): string | null => {
    if (list.length === 0) return null
    const leaves = list.map((p) => makeLeaf([p.id]))
    for (const leaf of leaves) nodes[leaf.id] = leaf
    return stackColumn(nodes, leaves)
  }
  const leftId = column(left)
  const rightId = column(right)

  // The right column is the primary of a reversed split, so it keeps its
  // width however the left one is resized.
  let rootId = RESERVED_STAGE_ID
  if (rightId) {
    const split: ZoneSplit = { ...makeSplit('row', rightId, rootId, 220), reversed: true }
    nodes[split.id] = split
    rootId = split.id
  }
  if (leftId) {
    const split = makeSplit('row', leftId, rootId, 220)
    nodes[split.id] = split
    rootId = split.id
  }
  if (options.hasTimeline) {
    nodes[RESERVED_TIMELINE_ID] = makeReservedLeaf(RESERVED_TIMELINE_ID)
    const split = makeSplit('col', RESERVED_TIMELINE_ID, rootId, 200)
    nodes[split.id] = split
    rootId = split.id
  }

  return { rootId, nodes }
}

/** Stacks leaves top to bottom as right-leaning col splits; returns the root's id. */
function stackColumn(nodes: Record<string, ZoneNode>, leaves: ZoneLeaf[]): string {
  let rootId = leaves[leaves.length - 1]!.id
  for (let i = leaves.length - 2; i >= 0; i--) {
    const split = makeSplit('col', leaves[i]!.id, rootId)
    nodes[split.id] = split
    rootId = split.id
  }
  return rootId
}

/**
 * Turns a {@link LayoutSpec} into a workspace tree, ready for
 * `panelsActions.hydrate`.
 *
 * ```ts
 * store.dispatch(panelsActions.hydrate({ workspace: buildFromSpec(layout), floating: [] }))
 * ```
 */
export function buildFromSpec(spec: LayoutSpec): ZoneTree {
  const nodes: Record<string, ZoneNode> = {}
  const rootId = buildSpecNode(spec, nodes)
  return { rootId, nodes }
}

function reserved(id: string, nodes: Record<string, ZoneNode>): string {
  nodes[id] ??= makeReservedLeaf(id)
  return id
}

function buildSpecNode(spec: LayoutSpec, nodes: Record<string, ZoneNode>): string {
  switch (spec.kind) {
    case 'stage':
      return reserved(RESERVED_STAGE_ID, nodes)
    case 'timeline':
      return reserved(RESERVED_TIMELINE_ID, nodes)
    case 'panel': {
      const leaf = makeLeaf([spec.id], undefined, false, spec.headless)
      nodes[leaf.id] = leaf
      return leaf.id
    }
    case 'tabs': {
      const leaf = makeLeaf(spec.ids, spec.activeId, false, spec.headless)
      nodes[leaf.id] = leaf
      return leaf.id
    }
    case 'row':
    case 'col':
      return buildSpecChildren(spec.kind, spec.children, nodes)
  }
}

function buildSpecChildren(
  orientation: 'col' | 'row',
  children: LayoutSpecChild[],
  nodes: Record<string, ZoneNode>
): string {
  // An empty row or column falls back to the stage rather than an empty tree.
  if (children.length === 0) return reserved(RESERVED_STAGE_ID, nodes)
  if (children.length === 1) return buildSpecNode(children[0]!.spec, nodes)

  const found = children.findIndex((c) => c.size == null)
  const fillIndex = found >= 0 ? found : children.length - 1
  let resultId = buildSpecNode(children[fillIndex]!.spec, nodes)

  // After the fill: each wraps the result as a reversed split, so the fixed
  // child sits at the far end.
  for (const child of children.slice(fillIndex + 1)) {
    const primaryId = buildSpecNode(child.spec, nodes)
    const split: ZoneSplit = {
      ...makeSplit(orientation, primaryId, resultId, child.size ?? 200),
      reversed: true,
    }
    nodes[split.id] = split
    resultId = split.id
  }

  // Before the fill, nearest first, so the first child ends up outermost.
  for (let i = fillIndex - 1; i >= 0; i--) {
    const child = children[i]!
    const primaryId = buildSpecNode(child.spec, nodes)
    const split = makeSplit(orientation, primaryId, resultId, child.size ?? 200)
    nodes[split.id] = split
    resultId = split.id
  }

  return resultId
}
