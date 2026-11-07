'use client'
import { useEffect, useState, type JSX } from 'react'
import { Button, Dialog, EditableField, Stack } from '@greese/react'
import type { AuthoringGuide } from '../../state/guides.slice.ts'

export interface GuidePropertiesDialogProps {
  /** The guide to edit; null closes the dialog. */
  guide: AuthoringGuide | null
  /** Called on Cancel, Escape, or after Save or Delete. */
  onClose: () => void
  /** Called on Save with the guide's name, whether it's global, and its position. */
  onSave: (name: string, isGlobal: boolean, pos: number) => void
  /** Called on Delete. */
  onDelete: () => void
}

/**
 * A guide's properties: its name, its position along its axis, and whether
 * it's global (seen from every subview, not only the one it was made in).
 * Delete removes it.
 *
 * ```tsx
 * <GuidePropertiesDialog guide={editing} onClose={close} onSave={save} onDelete={remove} />
 * ```
 */
export const GuidePropertiesDialog = ({
  guide,
  onClose,
  onSave,
  onDelete,
}: GuidePropertiesDialogProps): JSX.Element => {
  const [name, setName] = useState('')
  const [isGlobal, setIsGlobal] = useState(false)
  const [pos, setPos] = useState(0)

  // Starts from the guide each time it opens for one.
  useEffect(() => {
    if (!guide) return
    setName(guide.name ?? '')
    setIsGlobal(!!guide.isGlobal)
    setPos(guide.pos)
  }, [guide])

  return (
    <Dialog
      open={guide !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Guide properties"
      footer={
        <>
          <Button
            variant="text"
            tone="negative"
            onClick={() => {
              onDelete()
              onClose()
            }}
          >
            Delete
          </Button>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(name.trim(), isGlobal, pos)
              onClose()
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <Stack gap={3}>
        <EditableField type="text" label="Name" value={name} onValueChange={setName} />
        <EditableField
          type="number"
          label={guide?.axis === 'v' ? 'X' : 'Y'}
          value={pos}
          onValueChange={(value) => setPos(value ?? 0)}
        />
        <EditableField
          type="switch"
          label="Global guide"
          value={isGlobal}
          onValueChange={setIsGlobal}
        />
      </Stack>
    </Dialog>
  )
}
