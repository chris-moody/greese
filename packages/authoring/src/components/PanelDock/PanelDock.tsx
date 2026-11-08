'use client'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentPropsWithRef,
  type JSX,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { composeRefs, cx } from '@greese/react'
import { buildDefaultTree } from '../../core/layoutTree.construction.ts'
import {
  ensureReservedLeaves,
  mergeUnknownPanels,
  pruneUnknownPanels,
} from '../../core/layoutTree.mutations.ts'
import { collectPanelIds, isReservedLeaf } from '../../core/layoutTree.queries.ts'
import type { DropTarget, ZoneTree } from '../../core/layoutTree.types.ts'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { panelsActions } from '../../state/panels.slice.ts'
import {
  selectPanelFloating,
  selectPanelLayoutKey,
  selectPanelWorkspace,
} from '../../state/selectors.ts'
import { SplitPane } from '../SplitPane/SplitPane.tsx'
import { FloatingPanels } from './FloatingPanels.tsx'
import { DropHighlight, PanelGroup, type PanelMeta } from './PanelGroup.tsx'
import type { PanelRegistrant } from './panel.types.ts'
import { useDockDrag } from './useDockDrag.ts'

/** A collapsed group's height: its tab row. */
const COLLAPSED_SIZE = 36

export interface PanelDockProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The panels the editor offers. Panels in the layout but not here are dropped from it. */
  panels: readonly PanelRegistrant[]
  /** Whether the workspace has a timeline leaf. @default false */
  hasTimeline?: boolean
  /**
   * Renders the stage's and the timeline's leaves, given `RESERVED_STAGE_ID` or
   * `RESERVED_TIMELINE_ID`. Without it the workspace has no reserved leaves
   * (an editor with no canvas registers its stage as an ordinary panel).
   */
  renderReserved?: (reservedId: string) => ReactNode
  /**
   * Which workspace this dock shows, when one editor has several (design,
   * code; pose, animation). When the store holds another workspace's layout,
   * the dock seeds its own from `initialWorkspace` instead of reconciling the
   * foreign one. Pair it with `useLayoutCache` to bring back each workspace's
   * arrangement.
   */
  layoutKey?: string
  /**
   * The workspace to start with when the store has none, usually
   * `buildFromSpec(layout)`. Without it, one is built from the panels' areas.
   * Ignored once the store has a workspace.
   */
  initialWorkspace?: ZoneTree
}

interface NodeViewProps {
  nodeId: string
  tree: ZoneTree
  panelMeta: Map<string, PanelMeta>
  dragId: string | null
  dropTarget: DropTarget
  renderReserved: (id: string) => ReactNode
  onSelectTab: (leafId: string, tabId: string) => void
  onToggleCollapsed: (leafId: string, collapsed: boolean) => void
  onSplitResize: (splitId: string, primarySize: number) => void
  startDrag: (panelId: string) => (event: PointerEvent<HTMLElement>) => void
  renderBody: (panelId: string) => ReactNode
}

/** One node of the tree: a group, a reserved leaf, or a split around two more. */
const NodeView = memo(function NodeView(props: NodeViewProps) {
  const { nodeId, tree, dropTarget } = props
  const node = tree.nodes[nodeId]
  if (!node) return null

  if (node.kind === 'leaf') {
    if (isReservedLeaf(node)) {
      // A drop target too, for its edges only: panels dock beside the stage
      // and timeline, never into them.
      const zone =
        dropTarget?.kind === 'leaf' && dropTarget.leafId === node.id
          ? dropTarget.zone
          : null
      return (
        <div
          className="greese-PanelDock-node"
          data-reserved-id={node.id}
          data-leaf-id={node.id}
        >
          {props.renderReserved(node.id)}
          {zone && <DropHighlight zone={zone} />}
        </div>
      )
    }
    return (
      <div className="greese-PanelDock-node">
        <PanelGroup
          leaf={node}
          panelMeta={props.panelMeta}
          dragId={props.dragId}
          activeDropZone={
            dropTarget?.kind === 'leaf' && dropTarget.leafId === node.id
              ? dropTarget.zone
              : null
          }
          dropTabIndex={
            dropTarget?.kind === 'tab' && dropTarget.leafId === node.id
              ? dropTarget.index
              : null
          }
          onSelectTab={props.onSelectTab}
          onToggleCollapsed={props.onToggleCollapsed}
          startDrag={props.startDrag}
          renderBody={props.renderBody}
        />
      </div>
    )
  }

  const collapsed = (id: string) => {
    const child = tree.nodes[id]
    return child?.kind === 'leaf' && !isReservedLeaf(child) && child.collapsed
  }

  return (
    <div className="greese-PanelDock-node">
      <SplitPane
        // A split's id is stable across resizes; a new id means a new split.
        key={node.id}
        orientation={node.orientation}
        initialPrimarySize={node.primarySize}
        reversed={node.reversed}
        controlledPrimarySize={collapsed(node.children[0]) ? COLLAPSED_SIZE : undefined}
        secondaryCollapsed={collapsed(node.children[1])}
        onResizeEnd={(size) => props.onSplitResize(node.id, size)}
        primary={<NodeView {...props} nodeId={node.children[0]} />}
        secondary={<NodeView {...props} nodeId={node.children[1]} />}
      />
    </div>
  )
})

/**
 * The editor's workspace: stage, timeline and panels in one split tree. Drag
 * a tab to any edge of any group, onto a group to join it, onto a tab row to
 * put it there (in front of a tab, or after it from its right half), to the
 * workspace's outer edge, or onto empty space or its own group's body to
 * float it. The layout lives
 * in the store's `panels` slice, so it can be saved, cached per workspace and
 * restored. Splits, drags and floating moves write to the DOM while the
 * pointer moves and dispatch once on release, so panels and the stage never
 * re-render mid-gesture.
 *
 * ```tsx
 * <env.Provider>
 *   <PanelDock
 *     panels={[layersPanel, propertiesPanel]}
 *     initialWorkspace={useInitialWorkspace(layout)}
 *     renderReserved={(id) => (id === RESERVED_STAGE_ID ? <Stage /> : null)}
 *   />
 * </env.Provider>
 * ```
 */
export const PanelDock = ({
  panels,
  hasTimeline = false,
  renderReserved,
  initialWorkspace,
  layoutKey,
  className,
  ref,
  ...props
}: PanelDockProps): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const stored = useAuthoringSelector(selectPanelWorkspace)
  const floating = useAuthoringSelector(selectPanelFloating)
  const storedKey = useAuthoringSelector(selectPanelLayoutKey)
  // Another workspace's layout: rendered from the seed until it's replaced.
  const foreign = layoutKey !== undefined && storedKey !== layoutKey

  // Keyed by the ids alone, so moving a floating panel doesn't rebuild the workspace.
  const floatingKey = floating.map((f) => f.id).join('\0')
  const floatingIds = useMemo(
    () => new Set(floatingKey ? floatingKey.split('\0') : []),
    [floatingKey]
  )

  // Puts a workspace in the store on mount (and when the key changes), so
  // every reducer has a tree to edit, and this dock's own tree at that.
  useEffect(() => {
    if ((stored.rootId === null || foreign) && panels.length > 0) {
      dispatch(
        panelsActions.hydrate({
          workspace: initialWorkspace ?? buildDefaultTree(panels, { hasTimeline }),
          floating: foreign ? [] : floating,
          ...(layoutKey !== undefined && { layoutKey }),
        })
      )
    }
    // On mount and per key: later changes to the other props don't reseed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey])

  // The tree as rendered: the stored one reconciled with the current panels,
  // without touching the store. Reserved leaves are reconciled only when the
  // editor renders them; otherwise backfilling a stage leaf would wrap the
  // tree in a new split (a new id, so a remount) on every change.
  const workspace = useMemo<ZoneTree>(() => {
    const base =
      stored.rootId !== null && !foreign
        ? stored
        : (initialWorkspace ?? buildDefaultTree(panels, { hasTimeline }))
    const withReserved = renderReserved
      ? ensureReservedLeaves(base, { hasTimeline })
      : base
    return mergeUnknownPanels(
      pruneUnknownPanels(withReserved, panels),
      floatingIds,
      panels
    )
  }, [
    stored,
    foreign,
    initialWorkspace,
    panels,
    floatingIds,
    hasTimeline,
    renderReserved,
  ])

  // A FREE panel floats from its registration until it's moved; once docked,
  // it's in the tree and must not float as well.
  const docked = useMemo(() => new Set(collectPanelIds(workspace)), [workspace])

  const panelMeta = useMemo(
    () =>
      new Map<string, PanelMeta>(
        panels.map((p) => [
          p.id,
          {
            title: p.title,
            collapsible: p.collapsible,
            headless: p.headless,
            scrollable: p.scrollable ?? true,
            renderTabContent: p.renderTabContent,
          },
        ])
      ),
    [panels]
  )

  const bodies = useMemo(() => new Map(panels.map((p) => [p.id, p.component])), [panels])
  const renderBody = useCallback(
    (id: string): ReactNode => {
      const Body = bodies.get(id)
      return Body ? <Body /> : null
    },
    [bodies]
  )
  const renderReservedLeaf = useCallback(
    (id: string) => renderReserved?.(id) ?? null,
    [renderReserved]
  )

  const containerRef = useRef<HTMLDivElement | null>(null)
  const isHeadlessPanel = useCallback(
    (id: string) => panelMeta.get(id)?.headless === true,
    [panelMeta]
  )

  const commit = useCallback(
    (panelId: string, target: DropTarget, at: { x: number; y: number }) => {
      const headless = isHeadlessPanel(panelId) || undefined
      if (!target) {
        // Float it just under the pointer, where the ghost was.
        const rect = containerRef.current?.getBoundingClientRect()
        const x = rect ? Math.max(0, at.x - rect.left - 60) : 40
        const y = rect ? Math.max(0, at.y - rect.top - 10) : 40
        dispatch(panelsActions.floatPanel({ panelId, x, y }))
      } else if (target.kind === 'tab') {
        dispatch(
          panelsActions.moveTab({
            panelId,
            targetLeafId: target.leafId,
            index: target.index,
            headless,
          })
        )
      } else if (target.kind === 'leaf') {
        dispatch(
          panelsActions.movePanel({
            panelId,
            targetLeafId: target.leafId,
            zone: target.zone,
            headless,
          })
        )
      } else {
        dispatch(
          panelsActions.movePanelToContainerEdge({ panelId, edge: target.edge, headless })
        )
      }
    },
    [dispatch, isHeadlessPanel]
  )

  const { dragId, dropTarget, startDrag, registerGhost } = useDockDrag(
    commit,
    containerRef,
    isHeadlessPanel
  )

  const onSelectTab = useCallback(
    (leafId: string, tabId: string) =>
      dispatch(panelsActions.setLeafActiveTab({ leafId, tabId })),
    [dispatch]
  )
  const onToggleCollapsed = useCallback(
    (leafId: string, collapsed: boolean) =>
      dispatch(panelsActions.setLeafCollapsed({ leafId, collapsed })),
    [dispatch]
  )
  const onSplitResize = useCallback(
    (splitId: string, primarySize: number) =>
      dispatch(panelsActions.setSplitSize({ splitId, primarySize })),
    [dispatch]
  )

  const shared = {
    panelMeta,
    dragId,
    dropTarget,
    renderReserved: renderReservedLeaf,
    onSelectTab,
    onToggleCollapsed,
    onSplitResize,
    startDrag,
    renderBody,
  }

  return (
    <div
      {...props}
      ref={composeRefs(containerRef, ref)}
      className={cx(
        'greese-PanelDock',
        dragId && 'greese-PanelDock--dragging',
        className
      )}
    >
      {workspace.rootId && (
        <NodeView
          key={workspace.rootId}
          nodeId={workspace.rootId}
          tree={workspace}
          {...shared}
        />
      )}
      <FloatingPanels
        panels={panels}
        floating={floating}
        panelMeta={panelMeta}
        dragId={dragId}
        dropTarget={dropTarget}
        startDrag={startDrag}
        renderBody={renderBody}
        isHeadlessPanel={isHeadlessPanel}
        docked={docked}
      />
      {dragId && (
        <div ref={registerGhost} className="greese-PanelDock-ghost" aria-hidden="true">
          {panelMeta.get(dragId)?.title ?? dragId}
        </div>
      )}
    </div>
  )
}
