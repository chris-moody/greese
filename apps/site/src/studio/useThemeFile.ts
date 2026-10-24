import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, hosted } from './api.ts'
import type { ThemeSpec } from './spec.ts'

export interface ThemeFile {
  file: string
  outputs: string[]
  /** The spec as last read or saved: unsaved changes differ from it. */
  saved: string
}

export interface ThemeFileState {
  /** The file, once read (or the browser's copy, in the hosted studio). */
  file?: ThemeFile
  loadError?: string
  /** The spec differs from what was last read or saved. */
  dirty: boolean
  /** The file changed outside the studio while there were unsaved changes. */
  changedOnDisk: boolean
  /** Keeps the edits over a file changed on disk. */
  keepMine: () => void
  /** Reads the file again, taking its theme. */
  load: () => Promise<void>
  saving: boolean
  /** Saves; resolves with what stopped it, if anything. */
  save: () => Promise<string[] | undefined>
  /** `Saved <files>`, once the last save is all there is. */
  savedNote?: string
}

/**
 * The theme file the studio edits: the dev server reads and writes it; the
 * hosted studio works on the theme the shell holds (what was chosen in the
 * header, or last saved). Arriving keeps the theme you're wearing, which then
 * shows as unsaved if it differs from the file; only an explicit reload takes
 * the file's. An edit made outside the studio is loaded when there's nothing
 * unsaved to lose, and offered otherwise.
 */
export const useThemeFile = (
  spec: ThemeSpec,
  setSpec: (spec: ThemeSpec) => void
): ThemeFileState => {
  const [file, setFile] = useState<ThemeFile | undefined>(() =>
    hosted
      ? { file: 'Kept in this browser', outputs: [], saved: JSON.stringify(spec) }
      : undefined
  )
  const [loadError, setLoadError] = useState<string>()
  const [saving, setSaving] = useState(false)
  /** What the last save wrote; cleared by the next edit, since the button then says Save. */
  const [written, setWritten] = useState<string[]>()
  const [changedOnDisk, setChangedOnDisk] = useState(false)

  // Serialized when the spec or the file changes, not on every render.
  const dirty = useMemo(() => !!file && JSON.stringify(spec) !== file.saved, [spec, file])

  const read = useCallback(
    async (adopt: boolean) => {
      try {
        const loaded = await api.load()
        if (adopt) setSpec(loaded.spec)
        setFile({
          file: loaded.file,
          outputs: loaded.outputs,
          saved: JSON.stringify(loaded.spec),
        })
        setChangedOnDisk(false)
        setWritten(undefined)
        setLoadError(undefined)
      } catch (error) {
        setLoadError((error as Error).message)
      }
    },
    [setSpec]
  )

  useEffect(() => {
    if (!hosted) void read(false)
  }, [read])

  // Someone edited the theme file outside the studio.
  useEffect(() => {
    if (!import.meta.hot) return
    const onChange = () => setChangedOnDisk(true)
    import.meta.hot.on('studio:theme-changed', onChange)
    return () => import.meta.hot?.off('studio:theme-changed', onChange)
  }, [])
  useEffect(() => {
    if (changedOnDisk && !dirty) void read(true)
  }, [changedOnDisk, dirty, read])

  const save = async () => {
    setSaving(true)
    const result = await api.save(spec)
    setSaving(false)
    if (result.errors?.length) return result.errors
    setFile((f) => f && { ...f, saved: JSON.stringify(spec) })
    setChangedOnDisk(false)
    setWritten(result.written)
    return undefined
  }

  return {
    file,
    loadError,
    dirty,
    changedOnDisk,
    keepMine: () => setChangedOnDisk(false),
    load: () => read(true),
    saving,
    save,
    savedNote: !dirty && written ? `Saved ${written.join(', ')}` : undefined,
  }
}
