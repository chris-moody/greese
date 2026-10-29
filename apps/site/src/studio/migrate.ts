import { isBuiltInEffect } from '@greese/ui'
import { MOTIONS } from './motions.ts'
import type { ThemeSpec } from './spec.ts'

/**
 * Before themes reassigned roles (ADR 0025, "Themes reassign"), the shape and
 * motion themes wrote over tokens and effects: the square shape themes set the
 * radius scale to 0, the motion themes set the duration and easing tokens,
 * redefined built-in effects, and wrote overlays' motion and content
 * entrances into components. A theme worn or saved then keeps those values
 * after its layer is changed or removed (round knobs stay square), and a
 * built-in's redefinition no longer validates. These are exactly what those
 * presets wrote; anything else a theme sets is its own, and stays.
 */
const LEGACY_SQUARE = { sm: '0', md: '0', lg: '0', pill: '0', round: '0' }
const LEGACY_TIMING: Array<
  [duration: Record<string, string>, easing: Record<string, string>]
> = [
  [
    { fast: '80ms', normal: '140ms', slow: '220ms' },
    {
      standard: 'cubic-bezier(0.3, 0, 0, 1)',
      enter: 'cubic-bezier(0, 0, 0, 1)',
      exit: 'cubic-bezier(0.5, 0, 1, 1)',
    },
  ],
  [
    { fast: '180ms', normal: '320ms', slow: '560ms' },
    {
      standard: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
      exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
    },
  ],
  [
    { fast: '120ms', normal: '260ms', slow: '420ms' },
    {
      standard: 'cubic-bezier(0.65, 0, 0.35, 1)',
      enter: 'cubic-bezier(0.65, 0, 0.35, 1)',
      exit: 'cubic-bezier(0.65, 0, 0.35, 1)',
    },
  ],
  [
    { fast: '110ms', normal: '240ms', slow: '380ms' },
    {
      standard: 'cubic-bezier(0.2, 0, 0, 1)',
      enter: 'cubic-bezier(0.2, 0.9, 0.1, 1)',
      exit: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  ],
]
/** The components the old motion themes wrote motion or SCSS into. */
const LEGACY_MOTION = ['Toast', 'Dialog', 'Popover', 'Menu', 'Tooltip']
const LEGACY_SCSS =
  /animation(-name)?: greese-|--greese-motion-exit-translate: var\(--greese-overlay-origin\)/
const LEGACY_SCSS_ON = ['Drawer', 'TabPanel', 'Collapsible', 'Table']
const LEGACY_DEFAULTS = new Set(['duration', 'delay', 'ease', 'distance', 'stagger'])

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The page roles motion themes gained with page transitions (ADR 0029). */
const PAGE_ROLE = /^(page|share)(-|$)/

/**
 * A motion theme as it was before page transitions: its roles without the
 * page's. A theme worn or saved then wears it as it is now, page roles and
 * all, so the motion menu still knows it.
 */
const currentMotion = (defaults: Record<string, string> | undefined) =>
  defaults &&
  MOTIONS.find((preset) =>
    same(
      defaults,
      Object.fromEntries(
        Object.entries(preset.defaults).filter(([k]) => !PAGE_ROLE.test(k))
      )
    )
  )?.defaults

/** A stored theme without what the old layer presets overwrote; any other theme as it is. */
export const migrateSpec = (spec: ThemeSpec): ThemeSpec => {
  const tokens = { ...spec.tokens }
  if (same(tokens.radius, LEGACY_SQUARE)) delete tokens.radius
  const timing = LEGACY_TIMING.find(
    ([d, e]) => same(tokens.duration, d) && same(tokens.easing, e)
  )
  if (timing) {
    delete tokens.duration
    delete tokens.easing
  }
  const effects = Object.fromEntries(
    Object.entries(spec.effects ?? {}).filter(([name]) => !isBuiltInEffect(name))
  )
  const components = Object.fromEntries(
    Object.entries(spec.components ?? {}).flatMap(([name, c]) => {
      const next = { ...c }
      if (timing && LEGACY_MOTION.includes(name)) delete next.motion
      if (LEGACY_SCSS_ON.includes(name) && next.scss && LEGACY_SCSS.test(next.scss))
        delete next.scss
      return Object.keys(next).length ? [[name, next]] : []
    })
  )
  // An old motion theme's pacing only: no roles in it.
  const defaults =
    timing && Object.keys(spec.motionDefaults ?? {}).every((k) => LEGACY_DEFAULTS.has(k))
      ? undefined
      : (currentMotion(spec.motionDefaults) ?? spec.motionDefaults)
  const { effects: _e, motionDefaults: _m, ...rest } = spec
  return {
    ...rest,
    tokens,
    ...(spec.components && { components }),
    ...(Object.keys(effects).length && { effects }),
    ...(defaults && { motionDefaults: defaults }),
  }
}
