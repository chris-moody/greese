import type { Keyframe, Timeline } from '@greese/js'

/**
 * How the footer's logo moves, from the motion theme the page wears (ADR
 * 0025): its sparkles leave and come back the way that theme's entrances
 * arrive, at its pace, stagger and ease, and its particles drift the same
 * way, each on its own phase. The letters' and swoosh's gradients flow
 * underneath, one loop per cycle.
 */
export type LogoKind = 'float' | 'pop' | 'blur' | 'wipe' | 'pocket' | 'depth'

export interface LogoMotion {
  kind: LogoKind
  /** Seconds: the theme's entrance duration. */
  pace: number
  /** Seconds between neighbours in the theme's entrances. */
  stagger: number
  /** The theme's entrance ease, as greese.js takes it. */
  ease: string
}

/** Each kind's look, by the theme's `theme` entrance (its family). */
const KINDS: Array<[RegExp, LogoKind]> = [
  [/^(pop|scale|zoom|bounce)/, 'pop'],
  [/^blur/, 'blur'],
  [/^(wipe|iris)/, 'wipe'],
  [/^pocket/, 'pocket'],
  [/^(flip|turn|depth|swing|hinge)/, 'depth'],
]

const seconds = (value: string | undefined, fallback: number): number => {
  const n = parseFloat(value ?? '')
  if (!Number.isFinite(n)) return fallback
  return value!.trim().endsWith('ms') ? n / 1000 : n
}

/**
 * The logo's motion for a theme's `motionDefaults` (none: the base theme,
 * whose entrances fade up). `readEase` resolves a token name (`enter`) to
 * its CSS value; anything greese.js can't read falls back to `out`.
 */
export const logoMotion = (
  defaults: Record<string, string> | undefined,
  readEase: (token: string) => string = () => ''
): LogoMotion => {
  const theme = defaults?.theme ?? 'fade-up'
  const ease = defaults?.['enter-ease'] ?? ''
  const css = /^(standard|enter|exit)$/.test(ease) ? readEase(ease) : ease
  return {
    kind: KINDS.find(([test]) => test.test(theme))?.[1] ?? 'float',
    pace: Math.min(Math.max(seconds(defaults?.duration, 0.6), 0.2), 1.2),
    stagger: Math.min(Math.max(seconds(defaults?.stagger, 0.06), 0.02), 0.12),
    ease: /^cubic-bezier\([^)]*\)$/.test(css.trim()) ? css.trim() : 'out',
  }
}

/** A stable pseudo-random 0–1 per index and channel: the same loop every visit. */
const noise = (i: number, k = 0): number => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

type PerIndex = (i: number) => number

/**
 * Where a sparkle (or, with `soft`, a particle, which travels less) starts
 * its entrance, and leaves to. `far` gives each its own distance.
 */
const away = (kind: LogoKind, far: PerIndex, soft = false): Keyframe => {
  const k = soft ? 0.6 : 1
  switch (kind) {
    case 'pop':
      return { opacity: 0, scale: 0 }
    case 'blur':
      return { opacity: 0, scale: 1 + 1.4 * k }
    case 'wipe':
      return { opacity: 0, scaleY: 0 }
    case 'pocket':
      return { opacity: 0, y: (i) => far(i) * k }
    case 'depth':
      // A turn about the vertical axis, from behind: per-axis scales, since
      // `scale` and `scaleX` would both write the one `scale` property.
      return { opacity: 0, scaleX: -1, scaleY: 0.5 }
    default:
      return { opacity: 0, y: (i) => far(i) * k }
  }
}

/** The resting values of what `away` moves. */
const rest = (from: Keyframe): Keyframe => {
  const at: Keyframe = {}
  for (const prop in from) at[prop] = prop === 'y' ? 0 : 1
  return at
}

/**
 * One leave and return: out on an ease-in, hidden a moment, back in on the
 * theme's ease. Pop overshoots on the way back; the base theme's float
 * leaves upward and comes back from below, as a fade-up arrives.
 */
const twinkle = (m: LogoMotion, far: PerIndex, soft = false): Keyframe[] => {
  const from = away(m.kind, far, soft)
  const leave: Keyframe =
    m.kind === 'float' ? { ...from, y: (i) => -far(i) * (soft ? 0.6 : 1) } : from
  const frames: Keyframe[] = [
    { ...rest(from), ease: 'in' },
    { ...leave, offset: 0.25 },
    { ...from, offset: 0.4, ease: m.ease },
    { ...rest(from), offset: 1 },
  ]
  if (m.kind === 'pop')
    frames.splice(3, 0, {
      opacity: 1,
      scale: soft ? 1.6 : 1.3,
      offset: 0.7,
      ease: 'inOut',
    })
  return frames
}

export interface LogoParts {
  particles: Element[]
  sparkles: Element[]
  /** The letters' and the swoosh's gradients, each with its own direction of flow. */
  gradients: Array<[gradient: Element, flow: string]>
}

/**
 * Fills a paused, endlessly repeating timeline with the logo's loop. The
 * loop starts and ends with everything at rest, so a reduced-motion jump to
 * its end shows the logo as drawn.
 */
export const buildLogoLoop = (
  tl: Timeline,
  parts: LogoParts,
  m: LogoMotion
): Timeline => {
  const { particles, sparkles, gradients } = parts
  const twinkleFor = m.pace * 4
  const each = m.stagger * 4
  const spread = (sparkles.length - 1) * each + twinkleFor
  const period = Math.max(m.pace * 16, spread * 2.4, 6)

  // A reflected gradient repeats every two lengths: flowing that far is seamless.
  for (const [gradient, flow] of gradients)
    tl.animate(
      gradient,
      { gradientTransform: ['translate(0 0)', flow] },
      { duration: period, ease: 'linear' },
      0
    )

  // A wipe sweeps across, left to right; other themes take the sparkles in a
  // fixed scatter. Twice a loop, a stagger apart.
  const x = (el: Element) => (el as SVGGraphicsElement).getBBox?.().x ?? 0
  const sweep = m.kind === 'wipe'
  const order = sparkles
    .map((el, i) => [sweep ? x(el) : noise(i, 1), i] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, i]) => i)
  const rank = (i: number) => order.indexOf(i)
  const far = (i: number) => 8 + noise(i, 2) * 8
  for (const at of [period * 0.1, period - spread - period * 0.05])
    tl.animate(
      sparkles,
      twinkle(m, far),
      { duration: twinkleFor, stagger: (i) => rank(i) * each },
      at
    )

  // Particles: each its own moment in the loop, longer and subtler; in a
  // wipe, a wave across the logo.
  const drift = m.pace * 6
  const room = period - drift
  const width = Math.max(...particles.map(x), 1)
  tl.animate(
    particles,
    twinkle(m, (i) => 6 + noise(i, 3) * 10, true),
    {
      duration: drift,
      stagger: (i, el) =>
        sweep
          ? (x(el as Element) / width) * room * 0.5 + room * 0.25
          : noise(i, 4) * room,
    },
    0
  )
  return tl
}
