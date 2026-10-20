import { createContext, use } from 'react'
import type { RenderedColors } from './studio/protocol.ts'
import type { ThemeSpec } from './studio/spec.ts'

/** What the studio page offers the header, which shows its Save and Import controls. */
export interface StudioActions {
  dirty: boolean
  saving: boolean
  /** Save is possible: there are changes and the theme compiles. */
  canSave: boolean
  /** `Saved <files>`, once the last save is all there is. */
  savedNote?: string
  save: () => void
}

/**
 * State the header and both pages share: the theme being chosen (the
 * homepage wears it, the studio edits it), the motion replay counter, and, on
 * the studio page, what its header controls need.
 */
export interface Shell {
  spec: ThemeSpec
  setSpec: (spec: ThemeSpec) => void
  /** Each color as the studio's preview renders it, once it has reported. */
  rendered?: RenderedColors
  setRendered: (colors: RenderedColors | undefined) => void
  /** Bumped by "Replay motion": pages remount their animated content. */
  replay: number
  replayMotion: () => void
  inspect: boolean
  setInspect: (on: boolean) => void
  studio: StudioActions | null
  setStudio: (actions: StudioActions | null) => void
}

export const ShellContext = createContext<Shell | null>(null)

export const useShell = (): Shell => {
  const shell = use(ShellContext)
  if (!shell) throw new Error('useShell: no shell')
  return shell
}
