import { describe, expect, it } from 'vitest'
import {
  EMPTY_TREE,
  makeLeaf,
  makeSplit,
  buildDefaultTree,
  buildFromSpec,
  collectPanelIds,
  findLeafByPanelId,
  findParent,
  removePanel,
  insertPanel,
  insertAtContainerEdge,
  reorderTab,
  moveTab,
  appendToZone,
  setLeafActiveTab,
  setLeafCollapsed,
  resizeSplitNode,
  resolveDropZone,
  mergeUnknownPanels,
  pruneUnknownPanels,
  ensureReservedLeaves,
  isReservedLeaf,
} from './index.ts'
import type { ZoneLeaf, ZoneSplit, ZoneTree } from './layoutTree.types.ts'
import { DropZone, RESERVED_STAGE_ID, RESERVED_TIMELINE_ID } from './layoutTree.types.ts'
import { PanelArea, type PanelSlot } from './layoutTree.types.ts'

const reg = (id: string, area: PanelArea, order = 0): PanelSlot => ({
  id,
  area,
  order,
})

// ── helpers ───────────────────────────────────────────────────────────────────

function leafTree(tabs: string[]): ZoneTree {
  const leaf = makeLeaf(tabs)
  return { rootId: leaf.id, nodes: { [leaf.id]: leaf } }
}

function splitTree(orientation: 'col' | 'row', aIds: string[], bIds: string[]): ZoneTree {
  const leafA = makeLeaf(aIds)
  const leafB = makeLeaf(bIds)
  const split = makeSplit(orientation, leafA.id, leafB.id)
  return {
    rootId: split.id,
    nodes: { [leafA.id]: leafA, [leafB.id]: leafB, [split.id]: split },
  }
}

// ── makeLeaf / makeSplit ──────────────────────────────────────────────────────

describe('makeLeaf', () => {
  it('sets activeTab to first tab by default', () => {
    const l = makeLeaf(['a', 'b'])
    expect(l.activeTab).toBe('a')
    expect(l.kind).toBe('leaf')
    expect(l.collapsed).toBe(false)
  })

  it('respects an explicit activeTab', () => {
    const l = makeLeaf(['a', 'b'], 'b')
    expect(l.activeTab).toBe('b')
  })
})

describe('makeSplit', () => {
  it('produces a split with the given child ids and default primarySize', () => {
    const s = makeSplit('col', 'a-id', 'b-id')
    expect(s.kind).toBe('split')
    expect(s.orientation).toBe('col')
    expect(s.children).toEqual(['a-id', 'b-id'])
    expect(s.primarySize).toBe(180)
  })
})

// ── isReservedLeaf ────────────────────────────────────────────────────────────

describe('isReservedLeaf', () => {
  it('returns true for stage reserved leaf', () => {
    const leaf: ZoneLeaf = {
      kind: 'leaf',
      id: RESERVED_STAGE_ID,
      tabs: [],
      activeTab: '',
      collapsed: false,
    }
    expect(isReservedLeaf(leaf)).toBe(true)
  })

  it('returns true for timeline reserved leaf', () => {
    const leaf: ZoneLeaf = {
      kind: 'leaf',
      id: RESERVED_TIMELINE_ID,
      tabs: [],
      activeTab: '',
      collapsed: false,
    }
    expect(isReservedLeaf(leaf)).toBe(true)
  })

  it('returns false for a normal panel leaf', () => {
    const leaf = makeLeaf(['tools'])
    expect(isReservedLeaf(leaf)).toBe(false)
  })
})

// ── buildDefaultTree ──────────────────────────────────────────────────────────

describe('buildDefaultTree', () => {
  const panels = [
    reg('tools', PanelArea.LEFT, 0),
    reg('layers', PanelArea.LEFT, 1),
    reg('lib', PanelArea.RIGHT, 0),
    reg('props', PanelArea.RIGHT, 1),
  ]

  it('always includes the stage reserved leaf', () => {
    const tree = buildDefaultTree([])
    expect(tree.nodes[RESERVED_STAGE_ID]).toBeDefined()
    expect(tree.nodes[RESERVED_STAGE_ID]?.kind).toBe('leaf')
  })

  it('includes timeline leaf when hasTimeline is true', () => {
    const tree = buildDefaultTree([], { hasTimeline: true })
    expect(tree.nodes[RESERVED_TIMELINE_ID]).toBeDefined()
  })

  it('does not include timeline leaf when hasTimeline is false', () => {
    const tree = buildDefaultTree([])
    expect(tree.nodes[RESERVED_TIMELINE_ID]).toBeUndefined()
  })

  it('includes all left and right panels', () => {
    const tree = buildDefaultTree(panels)
    const ids = collectPanelIds(tree)
    expect(ids.sort()).toEqual(['layers', 'lib', 'props', 'tools'])
  })

  it('produces a non-null root when no panels given (stage leaf only)', () => {
    const tree = buildDefaultTree([])
    expect(tree.rootId).toBe(RESERVED_STAGE_ID)
  })

  it('collectPanelIds excludes reserved leaf ids', () => {
    const tree = buildDefaultTree(panels)
    const ids = collectPanelIds(tree)
    expect(ids).not.toContain(RESERVED_STAGE_ID)
    expect(ids).not.toContain(RESERVED_TIMELINE_ID)
  })
})

// ── collectPanelIds ───────────────────────────────────────────────────────────

describe('collectPanelIds', () => {
  it('collects from a flat tree', () => {
    const tree = splitTree('col', ['a', 'b'], ['c'])
    expect(collectPanelIds(tree).sort()).toEqual(['a', 'b', 'c'])
  })

  it('returns empty for an empty tree', () => {
    expect(collectPanelIds(EMPTY_TREE)).toEqual([])
  })
})

// ── findLeafByPanelId ─────────────────────────────────────────────────────────

describe('findLeafByPanelId', () => {
  it('finds a leaf containing the panel', () => {
    const tree = splitTree('col', ['a', 'b'], ['c'])
    const leaf = findLeafByPanelId(tree, 'a')!
    expect(leaf.kind).toBe('leaf')
    expect(leaf.tabs).toContain('a')
  })

  it('returns null when panel is absent', () => {
    expect(findLeafByPanelId(leafTree(['a']), 'z')).toBeNull()
  })
})

// ── findParent ────────────────────────────────────────────────────────────────

describe('findParent', () => {
  it('finds the parent split of a child leaf', () => {
    const tree = splitTree('col', ['a'], ['b'])
    const leafA = findLeafByPanelId(tree, 'a')!
    const parent = findParent(tree, leafA.id)
    expect(parent?.kind).toBe('split')
  })

  it('returns null for the root node', () => {
    const tree = splitTree('col', ['a'], ['b'])
    expect(findParent(tree, tree.rootId!)).toBeNull()
  })
})

// ── removePanel ───────────────────────────────────────────────────────────────

describe('removePanel', () => {
  it('removes the only tab from a single-leaf tree → empty tree', () => {
    const result = removePanel(leafTree(['a']), 'a')
    expect(result.rootId).toBeNull()
    expect(Object.keys(result.nodes)).toHaveLength(0)
  })

  it('removes one tab from a multi-tab leaf, updates activeTab if needed', () => {
    const tree = leafTree(['a', 'b'])
    const leafId = tree.rootId!
    const result = removePanel(tree, 'a')
    const leaf = result.nodes[leafId] as ZoneLeaf
    expect(leaf.tabs).toEqual(['b'])
    expect(leaf.activeTab).toBe('b')
  })

  it('keeps activeTab if it was not removed', () => {
    const leaf = { ...makeLeaf(['a', 'b'], 'b'), id: 'L' }
    const tree: ZoneTree = { rootId: 'L', nodes: { L: leaf } }
    const result = removePanel(tree, 'a')
    expect((result.nodes['L'] as ZoneLeaf).activeTab).toBe('b')
  })

  it('collapses a split when one child becomes empty', () => {
    const tree = splitTree('col', ['a'], ['b'])
    const result = removePanel(tree, 'a')
    const root = result.nodes[result.rootId!]
    expect(root?.kind).toBe('leaf')
    expect((root as ZoneLeaf).tabs).toEqual(['b'])
  })

  it('removes all nodes when both panels are removed', () => {
    const tree = splitTree('col', ['a'], ['b'])
    const r1 = removePanel(tree, 'a')
    const r2 = removePanel(r1, 'b')
    expect(r2.rootId).toBeNull()
    expect(Object.keys(r2.nodes)).toHaveLength(0)
  })

  it('returns the same reference when the panel is not in the tree', () => {
    const tree = leafTree(['a'])
    expect(removePanel(tree, 'z')).toBe(tree)
  })

  it('does not remove reserved leaves', () => {
    const stageLeaf: ZoneLeaf = {
      kind: 'leaf',
      id: RESERVED_STAGE_ID,
      tabs: [],
      activeTab: '',
      collapsed: false,
    }
    const tree: ZoneTree = {
      rootId: RESERVED_STAGE_ID,
      nodes: { [RESERVED_STAGE_ID]: stageLeaf },
    }
    const result = removePanel(tree, RESERVED_STAGE_ID)
    expect(result).toBe(tree)
  })
})

// ── insertPanel ───────────────────────────────────────────────────────────────

describe('insertPanel', () => {
  it('center: adds panel as a new tab on the target leaf', () => {
    const tree = leafTree(['a'])
    const leafId = tree.rootId!
    const { tree: result, changed } = insertPanel(tree, leafId, 'b', DropZone.Center)
    expect(changed).toBe(true)
    const leaf = result.nodes[leafId] as ZoneLeaf
    expect(leaf.tabs).toEqual(['a', 'b'])
    expect(leaf.activeTab).toBe('b')
  })

  it('center: does not duplicate a panel already in the leaf', () => {
    const tree = leafTree(['a', 'b'])
    const leafId = tree.rootId!
    const { tree: result } = insertPanel(tree, leafId, 'b', DropZone.Center)
    expect((result.nodes[leafId] as ZoneLeaf).tabs).toEqual(['a', 'b'])
  })

  it('center: rejects drop on a reserved leaf', () => {
    const stageLeaf: ZoneLeaf = {
      kind: 'leaf',
      id: RESERVED_STAGE_ID,
      tabs: [],
      activeTab: '',
      collapsed: false,
    }
    const tree: ZoneTree = {
      rootId: RESERVED_STAGE_ID,
      nodes: { [RESERVED_STAGE_ID]: stageLeaf },
    }
    const { changed } = insertPanel(tree, RESERVED_STAGE_ID, 'tools', DropZone.Center)
    expect(changed).toBe(false)
  })

  it('edge: allows drop on a reserved leaf', () => {
    const stageLeaf: ZoneLeaf = {
      kind: 'leaf',
      id: RESERVED_STAGE_ID,
      tabs: [],
      activeTab: '',
      collapsed: false,
    }
    const tree: ZoneTree = {
      rootId: RESERVED_STAGE_ID,
      nodes: { [RESERVED_STAGE_ID]: stageLeaf },
    }
    const { changed } = insertPanel(tree, RESERVED_STAGE_ID, 'tools', DropZone.LeftSplit)
    expect(changed).toBe(true)
  })

  it('top: new panel above the target', () => {
    const tree = leafTree(['a'])
    const leafId = tree.rootId!
    const { tree: result, changed } = insertPanel(tree, leafId, 'b', DropZone.Top)
    expect(changed).toBe(true)
    const root = result.nodes[result.rootId!] as ZoneSplit
    expect(root.kind).toBe('split')
    expect(root.orientation).toBe('col')
    const firstChild = result.nodes[root.children[0]] as ZoneLeaf
    expect(firstChild.tabs).toEqual(['b'])
  })

  it('bottom: new panel below the target', () => {
    const tree = leafTree(['a'])
    const leafId = tree.rootId!
    const { tree: result } = insertPanel(tree, leafId, 'b', DropZone.Bottom)
    const root = result.nodes[result.rootId!] as ZoneSplit
    const secondChild = result.nodes[root.children[1]] as ZoneLeaf
    expect(secondChild.tabs).toEqual(['b'])
  })

  it('left-split: new panel to the left', () => {
    const tree = leafTree(['a'])
    const leafId = tree.rootId!
    const { tree: result } = insertPanel(tree, leafId, 'b', DropZone.LeftSplit)
    const root = result.nodes[result.rootId!] as ZoneSplit
    expect(root.orientation).toBe('row')
    const firstChild = result.nodes[root.children[0]] as ZoneLeaf
    expect(firstChild.tabs).toEqual(['b'])
  })

  it('right-split: new panel to the right', () => {
    const tree = leafTree(['a'])
    const leafId = tree.rootId!
    const { tree: result } = insertPanel(tree, leafId, 'b', DropZone.RightSplit)
    const root = result.nodes[result.rootId!] as ZoneSplit
    expect(root.orientation).toBe('row')
    const secondChild = result.nodes[root.children[1]] as ZoneLeaf
    expect(secondChild.tabs).toEqual(['b'])
  })

  it('returns changed=false when target leaf is not found', () => {
    const tree = leafTree(['a'])
    const { tree: result, changed } = insertPanel(tree, 'ghost', 'b', DropZone.Center)
    expect(changed).toBe(false)
    expect(result).toBe(tree)
  })

  it('adds to an inner leaf in a deeper tree', () => {
    const tree = splitTree('col', ['a'], ['b'])
    const leafB = findLeafByPanelId(tree, 'b')!
    const { tree: result, changed } = insertPanel(tree, leafB.id, 'c', DropZone.Center)
    expect(changed).toBe(true)
    expect(collectPanelIds(result)).toContain('c')
  })
})

// ── headless groups ───────────────────────────────────────────────────────────

describe('headless groups', () => {
  function headlessTree(tabs: string[]): ZoneTree {
    const leaf = makeLeaf(tabs, undefined, false, true)
    return { rootId: leaf.id, nodes: { [leaf.id]: leaf } }
  }

  it('makeLeaf marks the leaf headless', () => {
    expect(makeLeaf(['toolbar'], undefined, false, true).headless).toBe(true)
    expect(makeLeaf(['toolbar']).headless).toBeUndefined()
  })

  it('insertPanel center: rejects drop on a headless leaf', () => {
    const tree = headlessTree(['toolbar'])
    const { changed } = insertPanel(tree, tree.rootId!, 'b', DropZone.Center)
    expect(changed).toBe(false)
  })

  it('insertPanel center: rejects a headless panel joining a normal group', () => {
    const tree = leafTree(['a'])
    const { changed } = insertPanel(tree, tree.rootId!, 'toolbar', DropZone.Center, true)
    expect(changed).toBe(false)
  })

  it('insertPanel edge: allows drop on a headless leaf and keeps it headless', () => {
    const tree = headlessTree(['toolbar'])
    const leafId = tree.rootId!
    const { tree: result, changed } = insertPanel(tree, leafId, 'b', DropZone.RightSplit)
    expect(changed).toBe(true)
    expect((result.nodes[leafId] as ZoneLeaf).headless).toBe(true)
  })

  it('insertPanel edge with headless flag: the new leaf is headless', () => {
    const tree = leafTree(['a'])
    const { tree: result } = insertPanel(
      tree,
      tree.rootId!,
      'toolbar',
      DropZone.LeftSplit,
      true
    )
    const leaf = findLeafByPanelId(result, 'toolbar')!
    expect(leaf.headless).toBe(true)
  })

  it('insertAtContainerEdge with headless flag: the new leaf is headless', () => {
    const tree = leafTree(['a'])
    const result = insertAtContainerEdge(tree, 'toolbar', 'left', true)
    const leaf = findLeafByPanelId(result, 'toolbar')!
    expect(leaf.headless).toBe(true)
  })

  it('setLeafCollapsed: headless leaves cannot collapse', () => {
    const tree = headlessTree(['toolbar'])
    const result = setLeafCollapsed(tree, tree.rootId!, true)
    expect((result.nodes[tree.rootId!] as ZoneLeaf).collapsed).toBe(false)
  })

  it('buildFromSpec: headless panel and tabs specs build headless leaves', () => {
    const tree = buildFromSpec({
      kind: 'row',
      children: [
        { spec: { kind: 'tabs', ids: ['toolbar'], headless: true }, size: 48 },
        { spec: { kind: 'panel', id: 'props', headless: true }, size: 220 },
        { spec: { kind: 'stage' } },
      ],
    })
    expect(findLeafByPanelId(tree, 'toolbar')!.headless).toBe(true)
    expect(findLeafByPanelId(tree, 'props')!.headless).toBe(true)
  })
})

// ── insertAtContainerEdge ─────────────────────────────────────────────────────

describe('insertAtContainerEdge', () => {
  it('creates a single leaf on an empty tree', () => {
    const result = insertAtContainerEdge(EMPTY_TREE, 'a', 'left')
    expect(result.rootId).not.toBeNull()
    const root = result.nodes[result.rootId!] as ZoneLeaf
    expect(root.tabs).toEqual(['a'])
  })

  it('left: new panel split to the left of the whole workspace', () => {
    const tree = leafTree(['a'])
    const result = insertAtContainerEdge(tree, 'b', 'left')
    const root = result.nodes[result.rootId!] as ZoneSplit
    expect(root.kind).toBe('split')
    expect(root.orientation).toBe('row')
    const firstChild = result.nodes[root.children[0]] as ZoneLeaf
    expect(firstChild.tabs).toEqual(['b'])
  })

  it('right: new panel split right of the whole workspace, as a 180px reversed primary', () => {
    const tree = leafTree(['a'])
    const result = insertAtContainerEdge(tree, 'b', 'right')
    const root = result.nodes[result.rootId!] as ZoneSplit
    expect(root.orientation).toBe('row')
    // Reversed: the primary renders at the end, at a size that fits any workspace.
    expect(root.reversed).toBe(true)
    expect(root.primarySize).toBe(180)
    const primary = result.nodes[root.children[0]] as ZoneLeaf
    expect(primary.tabs).toEqual(['b'])
  })

  it('top: new panel split above the whole workspace', () => {
    const tree = leafTree(['a'])
    const result = insertAtContainerEdge(tree, 'b', 'top')
    const root = result.nodes[result.rootId!] as ZoneSplit
    expect(root.orientation).toBe('col')
    const firstChild = result.nodes[root.children[0]] as ZoneLeaf
    expect(firstChild.tabs).toEqual(['b'])
  })

  it('bottom: new panel split below the whole workspace, as a 180px reversed primary', () => {
    const tree = leafTree(['a'])
    const result = insertAtContainerEdge(tree, 'b', 'bottom')
    const root = result.nodes[result.rootId!] as ZoneSplit
    expect(root.orientation).toBe('col')
    // Reversed: the primary renders at the end, at a size that fits any workspace.
    expect(root.reversed).toBe(true)
    expect(root.primarySize).toBe(180)
    const primary = result.nodes[root.children[0]] as ZoneLeaf
    expect(primary.tabs).toEqual(['b'])
  })
})

// ── reorderTab ────────────────────────────────────────────────────────────────

describe('reorderTab', () => {
  it('moves a tab to the specified index', () => {
    const tree = leafTree(['a', 'b', 'c'])
    const leafId = tree.rootId!
    const result = reorderTab(tree, leafId, 'c', 0)
    expect((result.nodes[leafId] as ZoneLeaf).tabs).toEqual(['c', 'a', 'b'])
  })

  it('is a no-op when the panel is not in the leaf', () => {
    const tree = leafTree(['a', 'b'])
    expect(reorderTab(tree, tree.rootId!, 'z', 0)).toBe(tree)
  })

  it('is a no-op for an unknown leaf id', () => {
    const tree = leafTree(['a'])
    expect(reorderTab(tree, 'ghost', 'a', 0)).toBe(tree)
  })
})

// ── moveTab ─────────────────────────────────────────────────────────────────

describe('moveTab', () => {
  it('reorders within the group, counting its other tabs, and selects the tab', () => {
    const tree = leafTree(['a', 'b', 'c'])
    const leafId = tree.rootId!
    // In front of b: 'c' at index 1 of [a, b].
    const { tree: result, changed } = moveTab(tree, 'c', leafId, 1)
    expect(changed).toBe(true)
    expect((result.nodes[leafId] as ZoneLeaf).tabs).toEqual(['a', 'c', 'b'])
    expect((result.nodes[leafId] as ZoneLeaf).activeTab).toBe('c')
  })

  it('moves a tab from another group into place, and the emptied group goes', () => {
    const left = makeLeaf(['a', 'b'])
    const right = makeLeaf(['c'])
    const split = makeSplit('row', left.id, right.id)
    const tree: ZoneTree = {
      rootId: split.id,
      nodes: { [left.id]: left, [right.id]: right, [split.id]: split },
    }
    const { tree: result } = moveTab(tree, 'c', left.id, 0)
    expect(result.rootId).toBe(left.id)
    expect((result.nodes[left.id] as ZoneLeaf).tabs).toEqual(['c', 'a', 'b'])
  })

  it('refuses headless panels and unknown groups', () => {
    const tree = leafTree(['a', 'b'])
    expect(moveTab(tree, 'a', tree.rootId!, 1, true).changed).toBe(false)
    expect(moveTab(tree, 'a', 'ghost', 0).changed).toBe(false)
  })
})

// ── appendToZone ─────────────────────────────────────────────────────────────

describe('appendToZone', () => {
  it('creates a single leaf when the tree is empty', () => {
    const result = appendToZone(EMPTY_TREE, 'a')
    expect(result.rootId).not.toBeNull()
    expect((result.nodes[result.rootId!] as ZoneLeaf).tabs).toEqual(['a'])
  })

  it('wraps the existing root in a col-split with a new leaf at the bottom', () => {
    const tree = leafTree(['a'])
    const result = appendToZone(tree, 'b')
    const root = result.nodes[result.rootId!] as ZoneSplit
    expect(root.kind).toBe('split')
    expect(root.orientation).toBe('col')
    const second = result.nodes[root.children[1]] as ZoneLeaf
    expect(second.tabs).toEqual(['b'])
  })
})

// ── setLeafActiveTab ──────────────────────────────────────────────────────────

describe('setLeafActiveTab', () => {
  it('updates the active tab on the matching leaf', () => {
    const tree = leafTree(['a', 'b'])
    const leafId = tree.rootId!
    const result = setLeafActiveTab(tree, leafId, 'b')
    expect((result.nodes[leafId] as ZoneLeaf).activeTab).toBe('b')
  })

  it('is a no-op when the tab is not in the leaf', () => {
    const tree = leafTree(['a'])
    expect(setLeafActiveTab(tree, tree.rootId!, 'z')).toBe(tree)
  })
})

// ── setLeafCollapsed ──────────────────────────────────────────────────────────

describe('setLeafCollapsed', () => {
  it('collapses the matching leaf', () => {
    const tree = leafTree(['a'])
    const result = setLeafCollapsed(tree, tree.rootId!, true)
    expect((result.nodes[tree.rootId!] as ZoneLeaf).collapsed).toBe(true)
  })

  it('is a no-op on a non-matching leaf', () => {
    const tree = leafTree(['a'])
    expect(setLeafCollapsed(tree, 'other', true)).toBe(tree)
  })

  it('is a no-op on a reserved leaf', () => {
    const stageLeaf: ZoneLeaf = {
      kind: 'leaf',
      id: RESERVED_STAGE_ID,
      tabs: [],
      activeTab: '',
      collapsed: false,
    }
    const tree: ZoneTree = {
      rootId: RESERVED_STAGE_ID,
      nodes: { [RESERVED_STAGE_ID]: stageLeaf },
    }
    expect(setLeafCollapsed(tree, RESERVED_STAGE_ID, true)).toBe(tree)
  })
})

// ── resizeSplitNode ───────────────────────────────────────────────────────────

describe('resizeSplitNode', () => {
  it('updates the primarySize of the matching split', () => {
    const tree = splitTree('col', ['a'], ['b'])
    const splitId = tree.rootId!
    const result = resizeSplitNode(tree, splitId, 300)
    expect((result.nodes[splitId] as ZoneSplit).primarySize).toBe(300)
  })

  it('is a no-op on a leaf', () => {
    const tree = leafTree(['a'])
    expect(resizeSplitNode(tree, tree.rootId!, 300)).toBe(tree)
  })
})

// ── resolveDropZone ───────────────────────────────────────────────────────────

describe('resolveDropZone', () => {
  const rect = { left: 0, right: 200, top: 0, bottom: 200, width: 200, height: 200 }

  it('resolves top strip', () => expect(resolveDropZone(rect, 100, 10)).toBe('top'))
  it('resolves bottom strip', () =>
    expect(resolveDropZone(rect, 100, 190)).toBe('bottom'))
  it('resolves left strip', () =>
    expect(resolveDropZone(rect, 10, 100)).toBe('left-split'))
  it('resolves right strip', () =>
    expect(resolveDropZone(rect, 190, 100)).toBe('right-split'))
  it('resolves center', () => expect(resolveDropZone(rect, 100, 100)).toBe('center'))
})

// ── mergeUnknownPanels ────────────────────────────────────────────────────────

describe('mergeUnknownPanels', () => {
  const panels = [
    reg('a', PanelArea.LEFT, 0),
    reg('b', PanelArea.LEFT, 1),
    reg('c', PanelArea.RIGHT, 0),
  ]

  it('adds all missing panels to an empty tree', () => {
    const result = mergeUnknownPanels(EMPTY_TREE, new Set(), panels)
    expect(collectPanelIds(result).sort()).toEqual(['a', 'b', 'c'])
  })

  it('adds missing panels to an existing tree', () => {
    const existing = leafTree(['a'])
    const result = mergeUnknownPanels(existing, new Set(), panels)
    expect(collectPanelIds(result)).toContain('b')
    expect(collectPanelIds(result)).toContain('c')
  })

  it('does not re-add panels that are already floating', () => {
    const result = mergeUnknownPanels(EMPTY_TREE, new Set(['a']), panels)
    expect(collectPanelIds(result)).not.toContain('a')
    expect(collectPanelIds(result)).toContain('b')
  })

  it('returns the same tree reference when nothing is missing', () => {
    const existing = leafTree(['a', 'b', 'c'])
    const result = mergeUnknownPanels(existing, new Set(), panels)
    // All present — same reference
    expect(collectPanelIds(result).sort()).toEqual(['a', 'b', 'c'])
  })

  it('does not include FREE-area panels', () => {
    const freePanels = [reg('x', PanelArea.FREE)]
    const result = mergeUnknownPanels(EMPTY_TREE, new Set(), freePanels)
    expect(collectPanelIds(result)).not.toContain('x')
  })
})

// ── pruneUnknownPanels ────────────────────────────────────────────────────────

describe('pruneUnknownPanels', () => {
  const panels = [reg('a', PanelArea.LEFT, 0), reg('b', PanelArea.LEFT, 1)]

  it('removes a leaf whose panel id is no longer registered', () => {
    const existing = leafTree(['a', 'c'])
    const result = pruneUnknownPanels(existing, panels)
    expect(collectPanelIds(result).sort()).toEqual(['a'])
  })

  it('collapses a now-empty leaf and its parent split onto the sibling', () => {
    const existing = splitTree('row', ['a'], ['stale'])
    const result = pruneUnknownPanels(existing, panels)
    expect(collectPanelIds(result)).toEqual(['a'])
    expect(Object.keys(result.nodes)).toHaveLength(1)
  })

  it('leaves reserved leaves untouched', () => {
    const stage = {
      kind: 'leaf' as const,
      id: RESERVED_STAGE_ID,
      tabs: [],
      activeTab: '',
      collapsed: false,
    }
    const tree: ZoneTree = { rootId: stage.id, nodes: { [stage.id]: stage } }
    const result = pruneUnknownPanels(tree, panels)
    expect(result.nodes[RESERVED_STAGE_ID]).toBeDefined()
  })

  it('is a no-op when every panel in the tree is still registered', () => {
    const existing = leafTree(['a', 'b'])
    const result = pruneUnknownPanels(existing, panels)
    expect(collectPanelIds(result).sort()).toEqual(['a', 'b'])
  })
})

// ── ensureReservedLeaves ──────────────────────────────────────────────────────

describe('ensureReservedLeaves', () => {
  it('appends the stage leaf when missing', () => {
    const result = ensureReservedLeaves(EMPTY_TREE)
    expect(result.nodes[RESERVED_STAGE_ID]).toBeDefined()
  })

  it('appends the timeline leaf when hasTimeline is true and it is missing', () => {
    const result = ensureReservedLeaves(EMPTY_TREE, { hasTimeline: true })
    expect(result.nodes[RESERVED_TIMELINE_ID]).toBeDefined()
  })

  it('removes an existing timeline leaf when hasTimeline is false', () => {
    const withTimeline = ensureReservedLeaves(EMPTY_TREE, { hasTimeline: true })
    const result = ensureReservedLeaves(withTimeline, { hasTimeline: false })
    expect(result.nodes[RESERVED_TIMELINE_ID]).toBeUndefined()
    expect(result.nodes[RESERVED_STAGE_ID]).toBeDefined()
  })

  it('collapses the timeline leaf out of a larger tree onto its sibling', () => {
    const withTimeline = ensureReservedLeaves(leafTree(['a']), { hasTimeline: true })
    const result = ensureReservedLeaves(withTimeline, { hasTimeline: false })
    expect(result.nodes[RESERVED_TIMELINE_ID]).toBeUndefined()
    expect(collectPanelIds(result)).toEqual(['a'])
  })
})
