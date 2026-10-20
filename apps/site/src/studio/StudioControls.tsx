import type { JSX } from 'react'
import { Badge, Button, Switch, VisuallyHidden } from '@greese/react'
import { useShell } from '../shell.ts'
import { ImportDialog } from './ImportDialog.tsx'

/**
 * What the shared header adds on the studio page: Inspect, Import and Save,
 * with a green Saved badge (and the files it wrote, on hover) after a save.
 */
export const StudioControls = (): JSX.Element => {
  const { spec, setSpec, inspect, setInspect, studio } = useShell()
  return (
    <>
      <Switch label="Inspect" checked={inspect} onCheckedChange={setInspect} />
      <ImportDialog spec={spec} onImport={setSpec} />
      {studio?.savedNote && (
        <Badge tone="positive" variant="solid" title={studio.savedNote}>
          Saved
        </Badge>
      )}
      <Button
        size="sm"
        onClick={studio?.save}
        loading={studio?.saving}
        disabled={!studio?.canSave}
      >
        Save
      </Button>
      <VisuallyHidden role="status">{studio?.savedNote ?? ''}</VisuallyHidden>
    </>
  )
}
