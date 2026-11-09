'use client'
import { useEffect, useRef, type DragEvent, type JSX, type PointerEvent } from 'react'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { layersActions } from '../../state/layers.slice.ts'
import { NavMode } from '../../state/navigation.slice.ts'
import { selectNavigationStack } from '../../state/selectors.ts'
import { useNavigation } from '../../hooks/useNavigation.ts'
import { useCreateInstance } from '../../hooks/useCreateInstance.ts'
import { useStageDriver } from '../../hooks/useStageDriver.ts'
import { useWheelZoom } from '../../hooks/useWheelZoom.ts'
import type { StageBackend } from '../../core/stage/renderObject.types.ts'

export interface StageHostProps {
  /**
   * Called with the mounted backend, and with null when it unmounts: for a
   * sibling that needs it live (a text editor overlay's world-to-screen maths).
   */
  onBackendChange?: (backend: StageBackend | null) => void
  /** The stage's accessible name. @default 'Stage' */
  label?: string
  /**
   * Whether the wheel zooms at the pointer and a horizontal swipe or Shift
   * pans, as in Pixels (through the backend's `zoomBy` and `panBy`). Off, the
   * wheel is the browser's. @default true
   */
  wheelZoom?: boolean
}

/**
 * The stage: mounts the media's backend (`MediaConfig.createStage`) and turns
 * pointer input into editing. A click selects the topmost object under the
 * pointer; a double-click on a symbol instance opens its symbol in place; a
 * library asset dropped here becomes an instance where it lands; the wheel
 * zooms and pans (`wheelZoom`). The backend
 * draws and hit-tests, so this works with any renderer: Pixi, SVG, a canvas.
 * With no backend, a placeholder says so.
 *
 * ```tsx
 * renderReserved={(id) => (id === RESERVED_STAGE_ID ? <StageHost /> : null)}
 * ```
 */
export const StageHost = ({
  onBackendChange,
  label = 'Stage',
  wheelZoom = true,
}: StageHostProps): JSX.Element => {
  const { config, store } = useAuthoringEnvironment()
  const dispatch = useAuthoringDispatch()
  const { openAsset } = useNavigation()
  const createInstance = useCreateInstance()
  const stack = useAuthoringSelector(selectNavigationStack)
  const containerRef = useRef<HTMLDivElement>(null)
  const backendRef = useStageDriver(containerRef)
  const live = !!config.createStage
  useWheelZoom(containerRef, {
    enabled: wheelZoom && live,
    onZoom: (factor, clientX, clientY) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect)
        backendRef.current?.zoomBy?.(factor, {
          x: clientX - rect.left,
          y: clientY - rect.top,
        })
    },
    onPan: (dx, dy) => backendRef.current?.panBy?.(dx, dy),
  })

  // The raster ghost behind an opened symbol goes once it's no longer open in place.
  useEffect(() => {
    if (stack[stack.length - 1]?.mode !== NavMode.EDIT_IN_PLACE)
      backendRef.current?.clearGhost?.()
  }, [stack, backendRef])

  // The driver mounts the backend in an effect registered before this one.
  useEffect(() => {
    onBackendChange?.(backendRef.current)
    return () => onBackendChange?.(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendRef])

  const pointFor = (event: {
    currentTarget: HTMLDivElement
    clientX: number
    clientY: number
  }) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const hit = backendRef.current?.getObjectAt(pointFor(event))
    if (backendRef.current) dispatch(layersActions.setSelection(hit ? [hit.id] : []))
  }

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const assetId = event.dataTransfer.getData('itemId')
    if (!assetId) return
    const backend = backendRef.current
    const point = pointFor(event)
    const world = backend?.screenToWorld?.(point) ?? point
    createInstance(assetId, world.x, world.y)
  }

  const onDoubleClick = (event: PointerEvent<HTMLDivElement>) => {
    const backend = backendRef.current
    const hit = backend?.getObjectAt(pointFor(event))
    if (!backend || !hit) return
    const assetId = store.getState().layers.layers.get(hit.id)?.properties?.assetId
    if (typeof assetId !== 'string') return
    // Snapshot the parent before the scene swaps, to ghost it behind.
    backend.captureGhost?.()
    openAsset(assetId, NavMode.EDIT_IN_PLACE)
  }

  return (
    <div
      ref={containerRef}
      className="greese-StageHost"
      role="region"
      aria-label={label}
      onPointerDown={live ? onPointerDown : undefined}
      onDoubleClick={live ? onDoubleClick : undefined}
      onDragOver={live ? onDragOver : undefined}
      onDrop={live ? onDrop : undefined}
    >
      {!live && (
        <div className="greese-StageHost-placeholder">
          Stage · {config.mediaType} (no backend)
        </div>
      )}
    </div>
  )
}
