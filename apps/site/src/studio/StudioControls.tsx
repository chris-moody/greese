import type { JSX } from 'react'
import { Badge, Icon, IconButton, Stack, Switch, VisuallyHidden } from '@greese/react'
import { icons } from '../icons.tsx'
import { useShell } from '../shell.ts'
import { ImportDialog } from './ImportDialog.tsx'

interface StudioToolbarProps {
  /** Inspect is on: a click in the preview picks the component to edit. */
  inspect: boolean
  onInspect: (on: boolean) => void
  saving: boolean
  /** Save is possible: there are changes and the theme compiles. */
  canSave: boolean
  /** `Saved <files>`, once the last save is all there is. */
  savedNote?: string
  onSave: () => void
}

/**
 * The head of the studio's editor: Inspect, then Import and Save, with a
 * green Saved badge (and the files it wrote, on hover) after a save. In the
 * editor rather than the site's header, so on phones they open with it.
 */
export const StudioToolbar = ({
  inspect,
  onInspect,
  saving,
  canSave,
  savedNote,
  onSave,
}: StudioToolbarProps): JSX.Element => {
  const { spec, setSpec } = useShell()
  return (
    <Stack direction="row" align="center" gap={2} className="studio-toolbar">
      <Switch
        label={<Icon label="Inspect">{icons.inspect}</Icon>}
        title="Inspect: pick a component in the preview"
        checked={inspect}
        onCheckedChange={onInspect}
      />
      <Stack direction="row" align="center" gap={2} className="studio-toolbar-end">
        {savedNote && (
          <Badge tone="positive" variant="solid" title={savedNote}>
            Saved
          </Badge>
        )}
        <ImportDialog spec={spec} onImport={setSpec} />
        <IconButton
          size="sm"
          variant="solid"
          tone="primary"
          label="Save"
          onClick={onSave}
          loading={saving}
          disabled={!canSave}
        >
          <Icon>{icons.save}</Icon>
        </IconButton>
      </Stack>
      <VisuallyHidden role="status">{savedNote ?? ''}</VisuallyHidden>
    </Stack>
  )
}
