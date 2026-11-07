import {
  makeLeaf,
  makeReservedLeaf,
  makeSplit,
  type BuildDefaultTreeOptions,
} from './layoutTree.construction.ts'
import {
  collectPanelIds,
  findLeafByPanelId,
  findParent,
  isReservedLeaf,
} from './layoutTree.queries.ts'
import {
  PanelArea,
  RESERVED_STAGE_ID,
  RESERVED_TIMELINE_ID,
  type DropZone,
  type PanelSlot,
  type ZoneLeaf,
  type ZoneSplit,
  type ZoneTree,
} from './layoutTree.types.ts'

/*
 * Every function here is immutable: it returns a new tree, or the same one
 * when nothing changed.
 */

/** Removes a node and collapses its parent split onto the sibling. */
function detach(tree: ZoneTree, id: string): ZoneTree {
  const parent = findParent(tree, id)
  const nodes = { ...tree.nodes }
  delete nodes[id]
  if (!parent) return { rootId: null, nodes }

  const siblingId = parent.children[0] === id ? parent.children[1] : parent.children[0]
  const grandParent = findParent(tree, parent.id)
  delete nodes[parent.id]
  if (!grandParent) return { rootId: siblingId, nodes }

  nodes[grandParent.id] = {
    ...grandParent,
    children: [
      grandParent.children[0] === parent.id ? siblingId : grandParent.children[0],
      grandParent.children[1] === parent.id ? siblingId : grandParent.children[1],
    ],
  }
  return { rootId: tree.rootId, nodes }
}

/*
 * Tab edits in place. They rewrite only the `tabs` and `activeTab` of the leaf
 * that already holds the panel, never a split, so a temporary panel swap can't
 * collapse or split an ancestor it shares with the stage (which would remount
 * the stage's renderer).
 */

/** Replaces one tab with another, at the same position. */
export function replaceTabInLeaf(
  tree: ZoneTree,
  oldPanelId: string,
  newPanelId: string
): ZoneTree {
  const leaf = findLeafByPanelId(tree, oldPanelId)
  if (!leaf) return tree
  const tabs = leaf.tabs.map((id) => (id === oldPanelId ? newPanelId : id))
  const activeTab = leaf.activeTab === oldPanelId ? newPanelId : leaf.activeTab
  return { ...tree, nodes: { ...tree.nodes, [leaf.id]: { ...leaf, tabs, activeTab } } }
}

/**
 * Removes one tab without touching its leaf. Never use it on a leaf's last
 * tab: an empty leaf needs `removePanel`'s collapsing.
 */
export function removeTabFromLeaf(tree: ZoneTree, panelId: string): ZoneTree {
  const leaf = findLeafByPanelId(tree, panelId)
  if (!leaf) return tree
  const tabs = leaf.tabs.filter((id) => id !== panelId)
  const activeTab =
    leaf.activeTab === panelId ? (tabs[0] ?? leaf.activeTab) : leaf.activeTab
  return { ...tree, nodes: { ...tree.nodes, [leaf.id]: { ...leaf, tabs, activeTab } } }
}

/** Adds `newPanelId` as the active tab of the leaf holding `targetPanelId`. */
export function addTabToLeaf(
  tree: ZoneTree,
  targetPanelId: string,
  newPanelId: string
): ZoneTree {
  const leaf = findLeafByPanelId(tree, targetPanelId)
  if (!leaf || leaf.tabs.includes(newPanelId)) return tree
  const tabs = [...leaf.tabs, newPanelId]
  return {
    ...tree,
    nodes: { ...tree.nodes, [leaf.id]: { ...leaf, tabs, activeTab: newPanelId } },
  }
}

/**
 * Takes a panel out of the tree. An emptied leaf goes, and its parent split
 * collapses onto the sibling. Reserved leaves are never removed.
 */
export function removePanel(tree: ZoneTree, panelId: string): ZoneTree {
  const leaf = findLeafByPanelId(tree, panelId)
  if (!leaf || isReservedLeaf(leaf)) return tree

  const tabs = leaf.tabs.filter((t) => t !== panelId)
  if (tabs.length > 0) {
    const activeTab = tabs.includes(leaf.activeTab) ? leaf.activeTab : tabs[0]!
    return { ...tree, nodes: { ...tree.nodes, [leaf.id]: { ...leaf, tabs, activeTab } } }
  }
  return detach(tree, leaf.id)
}

/**
 * Puts a panel next to a leaf: as a tab (center), or in a new leaf that splits
 * it (an edge). Reserved and headless leaves take no tab drops, and a headless
 * panel joins no group. `changed` is false when the drop was refused or the
 * leaf wasn't found.
 */
export function insertPanel(
  tree: ZoneTree,
  targetLeafId: string,
  panelId: string,
  zone: DropZone,
  headless = false
): { tree: ZoneTree; changed: boolean } {
  const target = tree.nodes[targetLeafId]
  if (!target || target.kind !== 'leaf') return { tree, changed: false }

  if (zone === 'center') {
    if (isReservedLeaf(target) || target.headless || headless)
      return { tree, changed: false }
    const tabs = target.tabs.includes(panelId) ? target.tabs : [...target.tabs, panelId]
    return {
      tree: {
        ...tree,
        nodes: { ...tree.nodes, [targetLeafId]: { ...target, tabs, activeTab: panelId } },
      },
      changed: true,
    }
  }

  const leaf = makeLeaf([panelId], undefined, false, headless)
  const orientation = zone === 'left-split' || zone === 'right-split' ? 'row' : 'col'
  const leafFirst = zone === 'top' || zone === 'left-split'
  const split = leafFirst
    ? makeSplit(orientation, leaf.id, target.id)
    : makeSplit(orientation, target.id, leaf.id)

  const parent = findParent(tree, targetLeafId)
  const nodes = { ...tree.nodes, [leaf.id]: leaf, [split.id]: split }
  if (parent) {
    nodes[parent.id] = {
      ...parent,
      children: [
        parent.children[0] === targetLeafId ? split.id : parent.children[0],
        parent.children[1] === targetLeafId ? split.id : parent.children[1],
      ],
    }
  }
  return { tree: { rootId: parent ? tree.rootId : split.id, nodes }, changed: true }
}

/** Docks a panel along one outer edge of the whole workspace. */
export function insertAtContainerEdge(
  tree: ZoneTree,
  panelId: string,
  edge: 'top' | 'bottom' | 'left' | 'right',
  headless = false
): ZoneTree {
  const leaf = makeLeaf([panelId], undefined, false, headless)
  if (tree.rootId === null) return { rootId: leaf.id, nodes: { [leaf.id]: leaf } }

  const orientation = edge === 'top' || edge === 'bottom' ? 'col' : 'row'
  const leafFirst = edge === 'top' || edge === 'left'
  // The new panel is a 180px primary either way; at the end, a reversed split
  // puts it there. (Glop gave the old root a fixed 800px primary instead,
  // which left the panel no room in a workspace shorter or narrower than that.)
  const split: ZoneSplit = leafFirst
    ? makeSplit(orientation, leaf.id, tree.rootId, 180)
    : { ...makeSplit(orientation, leaf.id, tree.rootId, 180), reversed: true }
  return {
    rootId: split.id,
    nodes: { ...tree.nodes, [leaf.id]: leaf, [split.id]: split },
  }
}

/** Moves a tab to `index` within its leaf. */
export function reorderTab(
  tree: ZoneTree,
  leafId: string,
  panelId: string,
  index: number
): ZoneTree {
  const leaf = tree.nodes[leafId]
  if (!leaf || leaf.kind !== 'leaf') return tree
  const from = leaf.tabs.indexOf(panelId)
  if (from === -1) return tree
  const tabs = [...leaf.tabs]
  tabs.splice(from, 1)
  tabs.splice(Math.max(0, Math.min(index, tabs.length)), 0, panelId)
  return { ...tree, nodes: { ...tree.nodes, [leafId]: { ...leaf, tabs } } }
}

/** Adds a panel in a new leaf at the bottom of the tree. */
export function appendToZone(tree: ZoneTree, panelId: string): ZoneTree {
  const leaf = makeLeaf([panelId])
  return appendLeaf(tree, leaf)
}

function appendLeaf(tree: ZoneTree, leaf: ZoneLeaf): ZoneTree {
  if (tree.rootId === null)
    return { rootId: leaf.id, nodes: { ...tree.nodes, [leaf.id]: leaf } }
  const split = makeSplit('col', tree.rootId, leaf.id)
  return {
    rootId: split.id,
    nodes: { ...tree.nodes, [leaf.id]: leaf, [split.id]: split },
  }
}

export function setLeafActiveTab(
  tree: ZoneTree,
  leafId: string,
  tabId: string
): ZoneTree {
  const leaf = tree.nodes[leafId]
  if (!leaf || leaf.kind !== 'leaf' || !leaf.tabs.includes(tabId)) return tree
  return { ...tree, nodes: { ...tree.nodes, [leafId]: { ...leaf, activeTab: tabId } } }
}

/** Collapses or expands a group. Reserved and headless leaves don't collapse. */
export function setLeafCollapsed(
  tree: ZoneTree,
  leafId: string,
  collapsed: boolean
): ZoneTree {
  const leaf = tree.nodes[leafId]
  if (!leaf || leaf.kind !== 'leaf' || isReservedLeaf(leaf) || leaf.headless) return tree
  return { ...tree, nodes: { ...tree.nodes, [leafId]: { ...leaf, collapsed } } }
}

export function resizeSplitNode(
  tree: ZoneTree,
  splitId: string,
  primarySize: number
): ZoneTree {
  const node = tree.nodes[splitId]
  if (!node || node.kind !== 'split') return tree
  return { ...tree, nodes: { ...tree.nodes, [splitId]: { ...node, primarySize } } }
}

/**
 * Makes sure every docked panel is somewhere: those in neither the tree nor
 * `floatingIds` are appended at the bottom. Panels that are floating are
 * taken out of the tree, so a freshly built default tree doesn't duplicate
 * them.
 */
export function mergeUnknownPanels(
  tree: ZoneTree,
  floatingIds: Set<string>,
  panels: PanelSlot[]
): ZoneTree {
  let result = tree
  for (const id of floatingIds) result = removePanel(result, id)

  const placed = new Set(collectPanelIds(result))
  const missing = panels
    .filter(
      (p) => p.area !== PanelArea.FREE && !placed.has(p.id) && !floatingIds.has(p.id)
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  for (const p of missing) result = appendToZone(result, p.id)
  return result
}

/**
 * Takes out every panel that isn't in `panels`. An editor that swaps its panel
 * list by mode (graphics and animate, pose and animation) would otherwise keep
 * leaves for panels the new mode lacks, rendered as blank tabs.
 */
export function pruneUnknownPanels(tree: ZoneTree, panels: PanelSlot[]): ZoneTree {
  const valid = new Set(panels.map((p) => p.id))
  let result = tree
  for (const id of collectPanelIds(tree)) {
    if (!valid.has(id)) result = removePanel(result, id)
  }
  return result
}

/**
 * Makes the reserved leaves match: the stage is always there, and the
 * timeline is there exactly when `hasTimeline` is set. A missing leaf is
 * appended at the bottom; an unwanted timeline is removed. This backfills old
 * presets and keeps a stale cached tree honest.
 */
export function ensureReservedLeaves(
  tree: ZoneTree,
  options: BuildDefaultTreeOptions = {}
): ZoneTree {
  let result = tree
  if (!result.nodes[RESERVED_STAGE_ID]) {
    result = appendLeaf(result, makeReservedLeaf(RESERVED_STAGE_ID))
  }
  if (options.hasTimeline) {
    if (!result.nodes[RESERVED_TIMELINE_ID]) {
      result = appendLeaf(result, makeReservedLeaf(RESERVED_TIMELINE_ID))
    }
  } else if (result.nodes[RESERVED_TIMELINE_ID]) {
    result = detach(result, RESERVED_TIMELINE_ID)
  }
  return result
}
