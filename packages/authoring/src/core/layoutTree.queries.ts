import {
  DropZone,
  RESERVED_STAGE_ID,
  RESERVED_TIMELINE_ID,
  type LayoutSpec,
  type ZoneLeaf,
  type ZoneNode,
  type ZoneSplit,
  type ZoneTree,
} from './layoutTree.types.ts'

/**
 * Whether a leaf is the stage or the timeline. Also accepts `__stage__` and
 * `__timeline__`, the ids Glop documents used before Firestore's field-name
 * rules forced a change, so those documents still open.
 */
export function isReservedLeaf(leaf: ZoneLeaf): boolean {
  return (
    leaf.id === RESERVED_STAGE_ID ||
    leaf.id === RESERVED_TIMELINE_ID ||
    leaf.id === '__stage__' ||
    leaf.id === '__timeline__'
  )
}

/** Every panel id placed in the tree, excluding the reserved leaves. */
export function collectPanelIds(tree: ZoneTree): string[] {
  const ids: string[] = []
  for (const node of Object.values(tree.nodes)) {
    if (node.kind === 'leaf' && !isReservedLeaf(node)) ids.push(...node.tabs)
  }
  return ids
}

/** The leaf holding `panelId`, or null. */
export function findLeafByPanelId(tree: ZoneTree, panelId: string): ZoneLeaf | null {
  for (const node of Object.values(tree.nodes)) {
    if (node.kind === 'leaf' && node.tabs.includes(panelId)) return node
  }
  return null
}

export function findNodeById(tree: ZoneTree, id: string): ZoneNode | null {
  return tree.nodes[id] ?? null
}

/** The split holding `nodeId`, or null for the root. */
export function findParent(tree: ZoneTree, nodeId: string): ZoneSplit | null {
  for (const node of Object.values(tree.nodes)) {
    if (node.kind === 'split' && node.children.includes(nodeId)) return node
  }
  return null
}

/** How much of a leaf, from each edge, splits it rather than joining it as a tab. */
const EDGE_STRIP = 0.28

/** The least a docked pane may be along its split, as SplitPane allows. */
export const MIN_DOCK_SIZE = 80

/**
 * How big a panel docked on a leaf's edge starts: as far as the drop was from
 * that edge, so the pointer marks the new pane's other side. Dropped near a
 * leaf's top, a new row is shallow; further in, deeper. Clamped so both panes
 * keep `MIN_DOCK_SIZE`. `undefined` for a tab drop (center).
 */
export function dropSize(
  rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>,
  zone: DropZone,
  clientX: number,
  clientY: number
): number | undefined {
  const [distance, extent] =
    zone === DropZone.Top
      ? [clientY - rect.top, rect.height]
      : zone === DropZone.Bottom
        ? [rect.bottom - clientY, rect.height]
        : zone === DropZone.LeftSplit
          ? [clientX - rect.left, rect.width]
          : zone === DropZone.RightSplit
            ? [rect.right - clientX, rect.width]
            : [NaN, NaN]
  if (Number.isNaN(distance)) return undefined
  const most = Math.max(MIN_DOCK_SIZE, extent - MIN_DOCK_SIZE)
  return Math.round(Math.min(most, Math.max(MIN_DOCK_SIZE, distance)))
}

/** Which drop zone of a leaf the pointer is over. Top and bottom win over the sides. */
export function resolveDropZone(
  rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>,
  clientX: number,
  clientY: number
): DropZone {
  const relX = (clientX - rect.left) / rect.width
  const relY = (clientY - rect.top) / rect.height

  if (relY < EDGE_STRIP) return DropZone.Top
  if (relY > 1 - EDGE_STRIP) return DropZone.Bottom
  if (relX < EDGE_STRIP) return DropZone.LeftSplit
  if (relX > 1 - EDGE_STRIP) return DropZone.RightSplit
  return DropZone.Center
}

/** Every panel id a spec places, in layout order, excluding the stage and timeline. */
export function extractPanelIds(spec: LayoutSpec): string[] {
  switch (spec.kind) {
    case 'panel':
      return [spec.id]
    case 'tabs':
      return [...spec.ids]
    case 'row':
    case 'col':
      return spec.children.flatMap((c) => extractPanelIds(c.spec))
    case 'stage':
    case 'timeline':
      return []
  }
}
