/**
 * How the footer's logo moves, from the motion theme the page wears (ADR
 * 0025): its sparkles leave and come back the way that theme's entrances
 * arrive, and its particles drift the same way, each on its own phase, while
 * the letters' and swoosh's gradients flow underneath.
 *
 * The loop itself is CSS (site.scss, `site-logo-*` keyframes): it reads the
 * theme's pace, stagger and ease from its custom properties, so nothing runs
 * per frame in script and nothing in the DOM changes as it plays. This module
 * only picks the kind of motion, and gives each sparkle and particle its
 * place in the loop as custom properties, once.
 */
export type LogoKind = 'float' | 'pop' | 'blur' | 'wipe' | 'pocket' | 'depth'

/** Each kind's look, by the theme's `theme` entrance (its family). */
const KINDS: Array<[RegExp, LogoKind]> = [
  [/^(pop|scale|zoom|bounce)/, 'pop'],
  [/^blur/, 'blur'],
  [/^(wipe|iris)/, 'wipe'],
  [/^pocket/, 'pocket'],
  [/^(flip|turn|depth|swing|hinge)/, 'depth'],
]

/** The logo's kind of motion for a theme's `motionDefaults` (none: the base theme's fade-up, a float). */
export const logoKind = (defaults: Record<string, string> | undefined): LogoKind => {
  const theme = defaults?.theme ?? 'fade-up'
  return KINDS.find(([test]) => test.test(theme))?.[1] ?? 'float'
}

/** A stable pseudo-random 0–1 per index and channel: the same loop every visit. */
export const noise = (i: number, k = 0): number => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Each sparkle's place in the loop: its rank (it twinkles that many staggers
 * after the first) and how far it travels, in px. A wipe sweeps across them,
 * left to right; other kinds take them in a fixed scatter.
 */
export const sparkleTimings = (
  xs: readonly number[],
  kind: LogoKind
): Array<{ rank: number; far: number }> => {
  const order = xs
    .map((x, i) => [kind === 'wipe' ? x : noise(i, 1), i] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, i]) => i)
  return xs.map((_, i) => ({ rank: order.indexOf(i), far: 8 + noise(i, 2) * 8 }))
}

/**
 * Each particle's place in the loop, as a share of the time it waits (0–1),
 * and how far it travels, in px. In a wipe they go in a wave across the logo,
 * left to right.
 */
export const particleTimings = (
  xs: readonly number[],
  kind: LogoKind
): Array<{ phase: number; far: number }> => {
  const width = Math.max(...xs, 1)
  return xs.map((x, i) => ({
    phase: kind === 'wipe' ? (x / width) * 0.5 + 0.25 : noise(i, 4),
    far: 6 + noise(i, 3) * 10,
  }))
}
