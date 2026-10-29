import type { Ease } from '@greese/js'

/** Eases CSS can play: named ones resolve to `--greese-ease-*` (Motion.scss). */
const NAMED_EASES = /^(linear|ease|ease-in|ease-out|ease-in-out|in|out|inOut)$/

/** The CSS form of an ease, or undefined when only greese.js can play it. */
export const cssEase = (ease: Ease | undefined): string | undefined => {
  if (ease === undefined) return 'var(--greese-ease-out)'
  if (typeof ease === 'string')
    return NAMED_EASES.test(ease)
      ? `var(--greese-ease-${ease.replace('O', '-o')})`
      : undefined
  if (Array.isArray(ease)) return `cubic-bezier(${ease.join(', ')})`
  return undefined
}
