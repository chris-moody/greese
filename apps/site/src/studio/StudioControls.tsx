import type { JSX } from 'react'
import { Badge, Icon, IconButton, Switch, VisuallyHidden } from '@greese/react'
import { icons } from '../icons.tsx'
import { useShell } from '../shell.ts'
import { ImportDialog } from './ImportDialog.tsx'

/**
 * What the shared header adds on the studio page: Import and Save, with a
 * green Saved badge (and the files it wrote, on hover) after a save. Inspect
 * is separate (InspectSwitch): on phones it sits in the menu, these stay out.
 */
export const StudioControls = (): JSX.Element => {
  const { spec, setSpec, studio } = useShell()
  return (
    <>
      <ImportDialog spec={spec} onImport={setSpec} />
      {studio?.savedNote && (
        <Badge tone="positive" variant="solid" title={studio.savedNote}>
          Saved
        </Badge>
      )}
      <IconButton
        size="sm"
        variant="solid"
        tone="primary"
        label="Save"
        onClick={studio?.save}
        loading={studio?.saving}
        disabled={!studio?.canSave}
      >
        <Icon>{icons.save}</Icon>
      </IconButton>
      <VisuallyHidden role="status">{studio?.savedNote ?? ''}</VisuallyHidden>
    </>
  )
}

/** Inspect: click a component in the preview to edit its styles. */
export const InspectSwitch = (): JSX.Element => {
  const { inspect, setInspect } = useShell()
  return (
    <Switch
      label={<Icon label="Inspect">{icons.inspect}</Icon>}
      title="Inspect: pick a component in the preview"
      checked={inspect}
      onCheckedChange={setInspect}
    />
  )
}
