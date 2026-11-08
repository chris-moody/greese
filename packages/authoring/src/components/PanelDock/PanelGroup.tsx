'use client'
import { memo, useId, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { IconButton, Tooltip } from '@greese/react'
import { ChevronDownIcon, ChevronUpIcon } from '@greese/icons'
import type { DropZone, ZoneLeaf } from '../../core/layoutTree.types.ts'

export interface PanelMeta {
  title: string
  collapsible?: boolean
  headless?: boolean
  scrollable?: boolean
  renderTabContent?: (panelId: string) => ReactNode
}

export interface PanelGroupProps {
  leaf: ZoneLeaf
  panelMeta: Map<string, PanelMeta>
  dragId: string | null
  /** The zone to highlight when this group is the current drop target. */
  activeDropZone: DropZone | null
  onSelectTab: (leafId: string, tabId: string) => void
  onToggleCollapsed: (leafId: string, collapsed: boolean) => void
  startDrag: (panelId: string) => (event: PointerEvent<HTMLElement>) => void
  /** Moves the whole group from its tab row's background: floating groups. */
  onGroupDrag?: (event: PointerEvent<HTMLDivElement>) => void
  renderBody: (panelId: string) => ReactNode
}

const ZONE_EDGE = {
  top: 'top',
  bottom: 'bottom',
  'left-split': 'left',
  'right-split': 'right',
  center: 'center',
} as const

/** Where a dragged panel would land on a leaf: an edge bar, or a tint to join it. */
export const DropHighlight = ({ zone }: { zone: DropZone }) => (
  <div className="greese-PanelDock-drop" data-edge={ZONE_EDGE[zone]} />
)

/**
 * A dock leaf: a tab row and the active panel, or, for a headless group, a
 * drag bar and the panel. The tabs are a WAI-ARIA tab list (the arrow keys,
 * Home and End move between them) and double as drag handles. The root
 * carries `data-leaf-id` for the drag's hit testing. Memoized, so a drag
 * re-renders only the groups whose highlight changes.
 */
export const PanelGroup = memo(function PanelGroup({
  leaf,
  panelMeta,
  dragId,
  activeDropZone,
  onSelectTab,
  onToggleCollapsed,
  startDrag,
  onGroupDrag,
  renderBody,
}: PanelGroupProps) {
  const baseId = useId()
  const active = panelMeta.get(leaf.activeTab)
  const title = active?.title ?? leaf.activeTab
  const headless = leaf.headless || active?.headless
  const collapsed = !headless && leaf.collapsed
  const beingDragged = leaf.tabs.length === 1 && dragId === leaf.tabs[0]
  const tabId = (panelId: string) => `${baseId}-tab-${panelId}`
  const bodyId = `${baseId}-body`

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = leaf.tabs.indexOf(leaf.activeTab)
    const last = leaf.tabs.length - 1
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1
    if (next === -1) return
    event.preventDefault()
    const nextTab = leaf.tabs[next]!
    onSelectTab(leaf.id, nextTab)
    document.getElementById(tabId(nextTab))?.focus()
  }

  return (
    <div
      className="greese-PanelGroup"
      data-leaf-id={leaf.id}
      data-sole-panel-id={leaf.tabs.length === 1 ? leaf.tabs[0] : undefined}
      data-headless={headless ? '' : undefined}
      data-dragging={beingDragged ? '' : undefined}
    >
      {headless ? (
        // The bar is only a pointer handle; the panel is named by its region.
        <div
          className="greese-PanelGroup-handle"
          aria-hidden="true"
          onPointerDown={onGroupDrag ?? startDrag(leaf.activeTab)}
        />
      ) : (
        <div className="greese-PanelGroup-header" onPointerDown={onGroupDrag}>
          <div
            className="greese-PanelGroup-tabs"
            role="tablist"
            aria-label={`${title} panels`}
          >
            {leaf.tabs.map((panelId) => {
              const meta = panelMeta.get(panelId)
              const selected = panelId === leaf.activeTab
              return (
                <button
                  key={panelId}
                  id={tabId(panelId)}
                  type="button"
                  role="tab"
                  className="greese-PanelGroup-tab"
                  aria-selected={selected}
                  aria-controls={bodyId}
                  tabIndex={selected ? 0 : -1}
                  data-dragging={dragId === panelId ? '' : undefined}
                  onPointerDown={startDrag(panelId)}
                  onClick={() => onSelectTab(leaf.id, panelId)}
                  onKeyDown={onTabKeyDown}
                >
                  {meta?.renderTabContent
                    ? meta.renderTabContent(panelId)
                    : (meta?.title ?? panelId)}
                </button>
              )
            })}
          </div>
          {active?.collapsible !== false && (
            <Tooltip content={collapsed ? 'Expand' : 'Collapse'} placement="bottom">
              <IconButton
                size="sm"
                label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
                aria-expanded={!collapsed}
                aria-controls={bodyId}
                onClick={() => onToggleCollapsed(leaf.id, !leaf.collapsed)}
              >
                {collapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
              </IconButton>
            </Tooltip>
          )}
        </div>
      )}

      <div
        id={bodyId}
        className="greese-PanelGroup-body"
        role={headless ? 'region' : 'tabpanel'}
        aria-label={headless ? title : undefined}
        aria-labelledby={headless ? undefined : tabId(leaf.activeTab)}
        data-scrollable={active?.scrollable === false ? 'false' : undefined}
        hidden={collapsed}
      >
        {renderBody(leaf.activeTab)}
      </div>

      {activeDropZone && !beingDragged && <DropHighlight zone={activeDropZone} />}
    </div>
  )
})
