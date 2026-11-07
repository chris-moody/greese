'use client'
import type { JSX } from 'react'
import { EditableField, Text } from '@greese/react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { layersActions } from '../../state/layers.slice.ts'
import { selectSelectedLayers } from '../../state/selectors.ts'
import { PropertyGrid } from '../../components/PropertyGrid/PropertyGrid.tsx'
import { EmptyState, PanelBody } from '../panelParts.tsx'

/**
 * Layer properties panel: the fields every layer has, for the selected one.
 * Its name, visibility and lock are edited here; its type is shown. A medium
 * with properties of its own registers a richer panel in its place, or
 * beside it.
 *
 * ```tsx
 * const panels = [{ id: 'properties', title: 'Properties', area: PanelArea.RIGHT, component: LayerPropertiesPanel }]
 * ```
 */
export const LayerPropertiesPanel = (): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const selected = useAuthoringSelector(selectSelectedLayers)

  if (selected.length === 0) return <EmptyState>No layer selected</EmptyState>
  if (selected.length > 1)
    return <EmptyState>{selected.length} layers selected</EmptyState>
  const layer = selected[0]!

  const update = (updates: { name?: string; hidden?: boolean; locked?: boolean }) =>
    dispatch(layersActions.updateLayer({ id: layer.id, updates }))

  return (
    <PanelBody>
      <Text variant="caption" tone="muted">
        {layer.layerType}
      </Text>
      <PropertyGrid>
        <EditableField
          label="Name"
          value={layer.name}
          onValueChange={(name) => update({ name })}
        />
        <EditableField
          type="switch"
          label="Visible"
          value={!layer.hidden}
          onValueChange={(visible) => update({ hidden: !visible })}
        />
        <EditableField
          type="switch"
          label="Locked"
          value={!!layer.locked}
          onValueChange={(locked) => update({ locked })}
        />
      </PropertyGrid>
    </PanelBody>
  )
}
