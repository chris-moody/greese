import { createContext, use } from 'react'
import type { RenderedColors } from './studio/protocol.ts'
import type { ThemeSpec } from './studio/spec.ts'

/**
 * State the header and both pages share: the theme being chosen (the
 * homepage wears it, the studio edits it) and the motion replay counter.
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
}

export const ShellContext = createContext<Shell | null>(null)

export const useShell = (): Shell => {
  const shell = use(ShellContext)
  if (!shell) throw new Error('useShell: no shell')
  return shell
}
