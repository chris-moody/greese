import { describe, expect, it } from 'vitest'
import { panelsActions, panelsReducer, serializePanels } from './panels.slice.ts'
import { buildFromSpec, EMPTY_TREE, makeLeaf, makeSplit } from '../core/index.ts'
import { DropZone } from '../core/layoutTree.types.ts'
import type { ZoneLeaf, ZoneTree } from '../core/layoutTree.types.ts'

const init = () => panelsReducer(undefined, { type: '@@INIT' })

function singleLeafTree(tabs: string[]): ZoneTree {
  const leaf = makeLeaf(tabs)
  return { rootId: leaf.id, nodes: { [leaf.id]: leaf } }
}

// ── movePanel ────────────────────────────────────────────────────────────────

describe('movePanel', () => {
  it('joins panel as a tab on the target leaf', () => {
    const leafA = makeLeaf(['a'])
    const leafB = makeLeaf(['b'])
    const split = makeSplit('col', leafA.id, leafB.id)
    const workspace: ZoneTree = {
      rootId: split.id,
      nodes: { [leafA.id]: leafA, [leafB.id]: leafB, [split.id]: split },
    }

    let state = init()
    state = panelsReducer(
      state,
      panelsActions.hydrate({
        workspace,
        floating: [],
      })
    )

    state = panelsReducer(
      state,
      panelsActions.movePanel({
        panelId: 'a',
        targetLeafId: leafB.id,
        zone: DropZone.Center,
      })
    )

    // 'a' removed from leafA (which empties and collapses), then joined leafB
    const root = state.workspace.nodes[state.workspace.rootId!] as ZoneLeaf
    expect(root.kind).toBe('leaf')
    expect(root.tabs).toContain('a')
    expect(root.tabs).toContain('b')
  })
})

// ── movePanelToContainerEdge ──────────────────────────────────────────────────

describe('movePanelToContainerEdge', () => {
  it('adds a panel to the right edge of the workspace', () => {
    let state = init()
    state = panelsReducer(
      state,
      panelsActions.hydrate({
        workspace: singleLeafTree(['a']),
        floating: [],
      })
    )
    state = panelsReducer(
      state,
      panelsActions.movePanelToContainerEdge({ panelId: 'b', edge: 'right' })
    )
    // 'b' should not be floating and should exist in the workspace
    expect(state.floating.some((f) => f.id === 'b')).toBe(false)
    const allPanelIds = Object.values(state.workspace.nodes)
      .filter((n) => n.kind === 'leaf')
      .flatMap((n) => (n as ZoneLeaf).tabs)
    expect(allPanelIds).toContain('b')
  })

  it('appends to an existing workspace via a row-split', () => {
    let state = init()
    state = panelsReducer(
      state,
      panelsActions.hydrate({
        workspace: singleLeafTree(['a']),
        floating: [],
      })
    )
    state = panelsReducer(
      state,
      panelsActions.movePanelToContainerEdge({ panelId: 'b', edge: 'left' })
    )
    const root = state.workspace.nodes[state.workspace.rootId!]
    expect(root?.kind).toBe('split')
  })
})

// ── floatPanel ───────────────────────────────────────────────────────────────

describe('floatPanel', () => {
  it('removes the panel from the workspace and adds it to floating', () => {
    let state = init()
    state = panelsReducer(
      state,
      panelsActions.hydrate({
        workspace: singleLeafTree(['a']),
        floating: [],
      })
    )
    state = panelsReducer(state, panelsActions.floatPanel({ panelId: 'a', x: 10, y: 20 }))
    expect(state.workspace.rootId).toBeNull()
    expect(state.floating).toHaveLength(1)
    expect(state.floating[0]).toMatchObject({ id: 'a', x: 10, y: 20 })
  })

  it('re-floating an already-floating panel keeps its size', () => {
    let state = init()
    state = panelsReducer(
      state,
      panelsActions.hydrate({
        workspace: EMPTY_TREE,
        floating: [{ id: 'a', x: 10, y: 20, width: 400, height: 500 }],
      })
    )
    state = panelsReducer(state, panelsActions.floatPanel({ panelId: 'a', x: 60, y: 80 }))
    expect(state.floating).toHaveLength(1)
    expect(state.floating[0]).toMatchObject({
      id: 'a',
      x: 60,
      y: 80,
      width: 400,
      height: 500,
    })
  })

  it('moving a headless floating panel onto a leaf edge docks it as a headless leaf', () => {
    let state = init()
    state = panelsReducer(
      state,
      panelsActions.hydrate({
        workspace: singleLeafTree(['a']),
        floating: [{ id: 'toolbar', x: 10, y: 20 }],
      })
    )
    const targetLeafId = state.workspace.rootId!
    state = panelsReducer(
      state,
      panelsActions.movePanel({
        panelId: 'toolbar',
        targetLeafId,
        zone: DropZone.LeftSplit,
        headless: true,
      })
    )
    expect(state.floating).toHaveLength(0)
    const leaves = Object.values(state.workspace.nodes).filter(
      (n): n is ZoneLeaf => n.kind === 'leaf'
    )
    const toolbarLeaf = leaves.find((l) => l.tabs.includes('toolbar'))
    expect(toolbarLeaf?.headless).toBe(true)
  })

  it('a headless floating panel cannot join a leaf as a tab (center drop rejected)', () => {
    let state = init()
    state = panelsReducer(
      state,
      panelsActions.hydrate({
        workspace: singleLeafTree(['a']),
        floating: [{ id: 'toolbar', x: 10, y: 20 }],
      })
    )
    const targetLeafId = state.workspace.rootId!
    state = panelsReducer(
      state,
      panelsActions.movePanel({
        panelId: 'toolbar',
        targetLeafId,
        zone: DropZone.Center,
        headless: true,
      })
    )
    expect((state.workspace.nodes[targetLeafId] as ZoneLeaf).tabs).toEqual(['a'])
  })
})

// ── reorderTab ────────────────────────────────────────────────────────────────

describe('reorderTab', () => {
  it('reorders a tab within its leaf', () => {
    const leaf = makeLeaf(['a', 'b', 'c'])
    let state = init()
    state = panelsReducer(
      state,
      panelsActions.hydrate({
        workspace: { rootId: leaf.id, nodes: { [leaf.id]: leaf } },
        floating: [],
      })
    )
    state = panelsReducer(
      state,
      panelsActions.reorderTab({ leafId: leaf.id, panelId: 'c', index: 0 })
    )
    expect((state.workspace.nodes[leaf.id] as ZoneLeaf).tabs).toEqual(['c', 'a', 'b'])
  })
})

// ── setLeafActiveTab ──────────────────────────────────────────────────────────

describe('setLeafActiveTab', () => {
  it('switches the active tab on the matching leaf', () => {
    const leaf = makeLeaf(['a', 'b'], 'a')
    let state = init()
    state = panelsReducer(
      state,
      panelsActions.hydrate({
        workspace: { rootId: leaf.id, nodes: { [leaf.id]: leaf } },
        floating: [],
      })
    )
    state = panelsReducer(
      state,
      panelsActions.setLeafActiveTab({ leafId: leaf.id, tabId: 'b' })
    )
    expect((state.workspace.nodes[leaf.id] as ZoneLeaf).activeTab).toBe('b')
  })
})

// ── hydrate (round-trip) ──────────────────────────────────────────────────────

describe('panels serialization', () => {
  it('round-trips workspace and floating through hydrate', () => {
    const leaf = makeLeaf(['a', 'b'])
    const tree: ZoneTree = { rootId: leaf.id, nodes: { [leaf.id]: leaf } }

    let state = init()
    state = panelsReducer(
      state,
      panelsActions.hydrate({
        workspace: tree,
        floating: [{ id: 'c', x: 10, y: 20 }],
      })
    )

    const snap = serializePanels(state)
    expect((snap.workspace.nodes[leaf.id] as ZoneLeaf).tabs).toEqual(['a', 'b'])
    expect(snap.floating).toHaveLength(1)

    const restored = panelsReducer(init(), panelsActions.hydrate(snap))
    expect((restored.workspace.nodes[leaf.id] as ZoneLeaf).tabs).toEqual(['a', 'b'])
    expect(restored.floating[0]?.id).toBe('c')
  })

  it('hydrate is a no-op with undefined', () => {
    const state = init()
    const after = panelsReducer(state, panelsActions.hydrate(undefined))
    expect(after.workspace).toEqual(EMPTY_TREE)
  })
})

describe('movePanel onto a reserved leaf', () => {
  it('refuses a tab drop on the stage and leaves the layout as it was', () => {
    const workspace = buildFromSpec({
      kind: 'row',
      children: [
        { size: 200, spec: { kind: 'panel', id: 'a' } },
        { spec: { kind: 'stage' } },
      ],
    })
    const state = panelsReducer(
      init(),
      panelsActions.hydrate({ workspace, floating: [] })
    )
    const next = panelsReducer(
      state,
      panelsActions.movePanel({
        panelId: 'a',
        targetLeafId: '_stage_',
        zone: DropZone.Center,
      })
    )
    expect(next.workspace).toEqual(state.workspace)
  })

  it('docks beside the stage from an edge', () => {
    const workspace = buildFromSpec({
      kind: 'row',
      children: [
        { size: 200, spec: { kind: 'panel', id: 'a' } },
        { spec: { kind: 'stage' } },
      ],
    })
    const state = panelsReducer(
      init(),
      panelsActions.hydrate({ workspace, floating: [] })
    )
    const next = panelsReducer(
      state,
      panelsActions.movePanel({
        panelId: 'a',
        targetLeafId: '_stage_',
        zone: DropZone.Bottom,
      })
    )
    const root = next.workspace.nodes[next.workspace.rootId!]!
    expect(root.kind === 'split' && root.orientation).toBe('col')
    expect(root.kind === 'split' && root.children[0]).toBe('_stage_')
  })
})
