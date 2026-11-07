'use client'
import { useCallback, useMemo, useRef } from 'react'
import { buildFromSpec } from '../core/layoutTree.construction.ts'
import { extractPanelIds } from '../core/layoutTree.queries.ts'
import type { LayoutSpec, ZoneTree } from '../core/layoutTree.types.ts'
import type { PanelRegistrant } from '../components/PanelDock/panel.types.ts'
import {
  panelsActions,
  serializePanels,
  type SerializedPanels,
} from '../state/panels.slice.ts'
import { selectPanelsState } from '../state/selectors.ts'
import type { AuthoringStore } from '../state/createAuthoringStore.ts'

/**
 * The panels a layout places, in layout order, looked up in the editor's
 * registry. Ids the registry lacks are skipped. Deriving the list from the
 * spec keeps the two in step: a panel registered but absent from the tree
 * would be appended as a stray leaf.
 *
 * ```tsx
 * const panels = usePanelListFromSpec(designLayout, ALL_PANELS)
 * ```
 */
export const usePanelListFromSpec = (
  spec: LayoutSpec,
  registry: Record<string, PanelRegistrant>
): PanelRegistrant[] =>
  useMemo(
    () =>
      extractPanelIds(spec)
        .map((id) => registry[id])
        .filter((p): p is PanelRegistrant => p !== undefined),
    [spec, registry]
  )

/**
 * A workspace built from a layout once, on mount: `PanelDock`'s
 * `initialWorkspace`.
 *
 * ```tsx
 * <PanelDock panels={panels} initialWorkspace={useInitialWorkspace(designLayout)} />
 * ```
 */
export const useInitialWorkspace = (spec: LayoutSpec): ZoneTree => {
  const ref = useRef<ZoneTree | null>(null)
  ref.current ??= buildFromSpec(spec)
  return ref.current
}

export interface LayoutCache {
  /** Saves the current layout under `key`. Call it just before leaving that workspace. */
  save: (key: string) => void
  /** Restores the layout saved under `key`, or builds `fallback` on a first visit. */
  restore: (key: string, fallback: LayoutSpec) => void
}

/**
 * Remembers each workspace's layout, so switching between an editor's
 * workspaces (graphics and animate; design, split and code) brings back how
 * the user arranged each one. Rulers aren't saved: they're one setting for
 * the whole editor, not one per workspace.
 *
 * ```ts
 * const cache = useLayoutCache(env.store)
 * cache.save('design')
 * cache.restore('code', codeLayout)
 * ```
 */
export const useLayoutCache = (store: AuthoringStore): LayoutCache => {
  const cache = useRef<Partial<Record<string, SerializedPanels>>>({})

  const save = useCallback(
    (key: string) => {
      const { showRulers: _rulers, ...rest } = serializePanels(
        selectPanelsState(store.getState())
      )
      cache.current[key] = rest
    },
    [store]
  )

  const restore = useCallback(
    (key: string, fallback: LayoutSpec) => {
      const saved = cache.current[key]
      store.dispatch(
        panelsActions.hydrate(
          saved ?? { workspace: buildFromSpec(fallback), floating: [] }
        )
      )
    },
    [store]
  )

  return { save, restore }
}
