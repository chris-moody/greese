'use client'
import { useEffect, useState, type JSX } from 'react'
import { Button, Select } from '@greese/react'
import { Dialog } from '@greese/react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../../environment/environment.tsx'
import { timelineActions } from '../../../state/timeline.slice.ts'
import { selectLayers, selectPendingPaste } from '../../../state/selectors.ts'
import { useTimelineEditing } from '../../useTimelineEditing.ts'
import type { PasteDecision } from '../../useTimelineEditing.ts'

/**
 * Prompts how to handle clipboard items whose source layer no longer exists:
 * Skip, Create a new layer, or Map to an existing layer (§20b layer mapping).
 */
export const PasteMappingDialog = (): JSX.Element | null => {
  const dispatch = useAuthoringDispatch()
  const pending = useAuthoringSelector(selectPendingPaste)
  const layers = useAuthoringSelector(selectLayers)
  const { pasteWithMapping } = useTimelineEditing()
  const [decisions, setDecisions] = useState<Record<string, PasteDecision>>({})

  useEffect(() => {
    if (pending) {
      setDecisions(Object.fromEntries(pending.missingLayers.map((id) => [id, 'create'])))
    }
  }, [pending])

  if (!pending) return null

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) dispatch(timelineActions.clearPendingPaste())
      }}
      title="Paste — map missing layers"
      footer={
        <>
          <Button
            variant="text"
            onClick={() => dispatch(timelineActions.clearPendingPaste())}
          >
            Cancel
          </Button>
          <Button variant="solid" onClick={() => pasteWithMapping(decisions)}>
            Paste
          </Button>
        </>
      }
    >
      {pending.missingLayers.map((source) => (
        <div className={'greese-PasteMappingDialog-row'} key={source}>
          <div className={'greese-PasteMappingDialog-source'}>{source}</div>
          <Select
            size="sm"
            aria-label={`Where to paste ${source}`}
            value={decisions[source] ?? 'create'}
            onChange={(event) =>
              setDecisions((prev) => ({
                ...prev,
                [source]: event.target.value as PasteDecision,
              }))
            }
          >
            <option value="create">Create Layer</option>
            <option value="skip">Skip</option>
            {[...layers.values()].map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </Select>
        </div>
      ))}
    </Dialog>
  )
}
