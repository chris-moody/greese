/**
 * Motion themes: the motion layer of a theme (ADR 0025). A motion theme only
 * assigns: which built-in effect plays where, and which duration and easing
 * it takes. It never redefines an effect or a token, so `fadeUp` still fades
 * up and `--greese-duration-slow` is still the library's (or the color and
 * shape themes' neighbours') value under every motion theme.
 *
 * The roles it assigns are the kit's `motion-defaults()` (styles/_kit.scss):
 *
 * - **theme:** the entrance `greese="theme"` plays (the homepage's and the
 *   templates' reveals).
 * - **content, rows:** tab panels' and an opening accordion's children (the
 *   container stays put), a table's rows, a stagger apart.
 * - **toast, dialog, popover, tooltip** and their **exits:** overlays arrive
 *   and leave the theme's way, unless a component's or an instance's own
 *   motion says otherwise. Drawers take their own role, which these leave be,
 *   so they keep sliding from their edge.
 * - **durations and eases** for those, as tokens (`slow`, `enter`) or values.
 * - **page, page-exit** and their **back** forms: how a page change plays
 *   (ADR 0029), in keeping with the theme's story, with its pace, stagger and
 *   exit order.
 *
 * It sets no colors and no shapes. Wipes, irises and pockets are masks, and
 * flips, swings and depth a `transform` with its own perspective: never
 * `clip-path`, which belongs to the element's shape (ADR 0024), and never the
 * resting transform a shape theme may give on hover or press.
 *
 * `npm run themes -w site` writes each as `@greese/ui/themes/<id>.scss` and
 * `.css`.
 */
import type { ThemeSpec } from './spec.ts'

export interface MotionPreset {
  id: string
  label: string
  /** What it feels like, in a sentence or two: the theme files' header. */
  description: string
  /** The pacing of every `greese` entrance and the roles it assigns: `motionDefaults`. */
  defaults: Record<string, string>
}

const SNAPPY: MotionPreset = {
  id: 'snappy',
  label: 'Snappy',
  description:
    'Snappy: quick and decisive. Short durations, a sharp curve, a tight stagger; things pop in from a short distance, and overlays scale in and away. Pages pop: the old one pops away all at once and the new one pops in.',
  defaults: {
    duration: '0.25s',
    distance: '0.5rem',
    stagger: '0.03s',
    theme: 'pop-in',
    content: 'fade-up',
    rows: 'fade-up',
    toast: 'pop-in',
    overlay: 'scale-in',
    'overlay-exit': 'scale-out',
    'content-duration': 'fast',
    'rows-duration': 'fast',
    'overlay-duration': 'fast',
    'toast-duration': 'fast',
    'exit-duration': 'fast',
    'enter-ease': 'cubic-bezier(0, 0, 0, 1)',
    'exit-ease': 'exit',
    // How pages change (ADR 0029).
    page: 'pop-in',
    'page-exit': 'pop-out',
    'page-duration': '0.25s',
    'page-ease': 'cubic-bezier(0, 0, 0, 1)',
    'page-stagger': '0.03s',
    'page-exit-order': 'together',
  },
}

const GENTLE: MotionPreset = {
  id: 'gentle',
  label: 'Gentle',
  description:
    'Gentle: unhurried and soft. Long durations that ease out and a wide stagger; things come into focus out of a blur, and overlays sink away. Pages change softly: the old one fades away while the new one comes into focus.',
  defaults: {
    duration: '0.8s',
    distance: '1.5rem',
    stagger: '0.09s',
    theme: 'blur-in',
    content: 'blur-in',
    rows: 'fade-up',
    toast: 'fade-up',
    overlay: 'blur-in',
    'overlay-exit': 'fade-out-down',
    'content-duration': 'slow',
    'rows-duration': 'slow',
    'overlay-duration': 'slow',
    'toast-duration': 'slow',
    'exit-duration': 'normal',
    'enter-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
    'exit-ease': 'cubic-bezier(0.7, 0, 0.84, 0)',
    // How pages change (ADR 0029).
    page: 'blur-in',
    'page-exit': 'fade-out',
    'page-duration': '0.7s',
    'page-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
    'page-stagger': '0.09s',
  },
}

const WIPE: MotionPreset = {
  id: 'wipe',
  label: 'Wipe',
  description:
    'Wipe: things are revealed in place rather than moved. Reveals wipe up, panels and toasts open from the middle, table rows wipe across, menus wipe down from their trigger and back up, tooltips open and close from the middle, and dialogs open and close as a circle. Pages change along one edge, the whole page at once: the next wipes in as the last wipes away, from the right going forward and from the left going back.',
  defaults: {
    duration: '0.6s',
    distance: '0.75rem',
    stagger: '0.06s',
    theme: 'wipe-up',
    content: 'wipe-open-x',
    rows: 'wipe-right',
    toast: 'wipe-open-x',
    dialog: 'iris-in',
    'dialog-exit': 'iris-out',
    popover: 'wipe-down',
    'popover-exit': 'wipe-out-up',
    tooltip: 'wipe-open-x',
    'tooltip-exit': 'wipe-close-x',
    'content-duration': 'normal',
    'rows-duration': 'slow',
    'overlay-duration': 'normal',
    'toast-duration': 'normal',
    'exit-duration': 'normal',
    'enter-ease': 'cubic-bezier(0.65, 0, 0.35, 1)',
    'exit-ease': 'cubic-bezier(0.65, 0, 0.35, 1)',
    // How pages change (ADR 0029).
    page: 'wipe-left',
    'page-exit': 'wipe-out-left',
    'page-back': 'wipe-right',
    'page-back-exit': 'wipe-out-right',
    'page-mode': 'snapshot',
    'page-duration': '0.6s',
    'page-ease': 'cubic-bezier(0.65, 0, 0.35, 1)',
    'page-stagger': '0.06s',
  },
}

const POCKET: MotionPreset = {
  id: 'pocket',
  label: 'Pocket',
  description:
    'Pocket: things rise out of an invisible slot at one of their own edges, as if from a pocket, rather than fading in. Reveals, panels, table rows and toasts rise out of theirs; menus drop out of a slot under their trigger and go back up into it; dialogs and tooltips rise out of a slot and sink back into it. Pages sink into a slot at their foot and the next rises out of it; going back, they go up into a slot at their head and the last drops out of it.',
  defaults: {
    duration: '0.55s',
    distance: '1.25rem',
    stagger: '0.05s',
    theme: 'pocket-up',
    content: 'pocket-up',
    rows: 'pocket-up',
    toast: 'pocket-up',
    dialog: 'pocket-up',
    'dialog-exit': 'pocket-out-down',
    popover: 'pocket-down',
    'popover-exit': 'pocket-out-up',
    tooltip: 'pocket-up',
    'tooltip-exit': 'pocket-out-down',
    'content-duration': 'normal',
    'rows-duration': 'slow',
    'overlay-duration': 'normal',
    'toast-duration': 'normal',
    'exit-duration': 'fast',
    'enter-ease': 'cubic-bezier(0.2, 0.9, 0.1, 1)',
    'exit-ease': 'exit',
    // How pages change (ADR 0029).
    page: 'pocket-up',
    'page-exit': 'pocket-out-down',
    'page-back': 'pocket-down',
    'page-back-exit': 'pocket-out-up',
    'page-duration': '0.55s',
    'page-ease': 'cubic-bezier(0.2, 0.9, 0.1, 1)',
    'page-stagger': '0.05s',
  },
}

const DEPTH: MotionPreset = {
  id: 'depth',
  label: 'Depth',
  description:
    'Depth: things turn into place in three dimensions. Reveals, panels, table rows and toasts flip up into place, menus swing down from their top edge like a sign and back up, tooltips flip up and back, and dialogs rise out of the page from behind it and sink back in. Pages are the two faces of a panel that turns half over, the whole page at once: one way going forward and the other going back.',
  defaults: {
    duration: '0.6s',
    distance: '1rem',
    stagger: '0.06s',
    theme: 'flip-up',
    content: 'flip-up',
    rows: 'flip-up',
    toast: 'flip-up',
    dialog: 'depth-in',
    'dialog-exit': 'depth-out',
    popover: 'swing-in',
    'popover-exit': 'swing-out',
    tooltip: 'flip-up',
    'tooltip-exit': 'flip-out-up',
    'content-duration': 'slow',
    'rows-duration': 'slow',
    'overlay-duration': 'normal',
    'toast-duration': 'slow',
    'exit-duration': 'normal',
    'enter-ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    'exit-ease': 'exit',
    // How pages change (ADR 0029).
    page: 'flip-over-right',
    'page-exit': 'flip-over-out-left',
    'page-back': 'flip-over-left',
    'page-back-exit': 'flip-over-out-right',
    'page-mode': 'snapshot',
    'page-duration': '0.8s',
    'page-ease': 'cubic-bezier(0.65, 0, 0.35, 1)',
    'page-stagger': '0.06s',
  },
}

export const MOTIONS: MotionPreset[] = [SNAPPY, GENTLE, WIPE, POCKET, DEPTH]

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The motion theme a theme wears, if any. */
export const motionIn = (spec: ThemeSpec): MotionPreset | undefined =>
  MOTIONS.find((preset) => same(spec.motionDefaults, preset.defaults))

/** The theme without any motion theme: its role assignments go. */
export const withoutMotion = (spec: ThemeSpec): ThemeSpec => {
  if (!motionIn(spec)) return spec
  const { motionDefaults: _m, ...base } = spec
  return base
}

/** A motion theme in place of any other; colors and shapes stay. */
export const applyMotion = (
  spec: ThemeSpec,
  preset: MotionPreset | undefined
): ThemeSpec => {
  const base = withoutMotion(spec)
  return preset ? { ...base, motionDefaults: { ...preset.defaults } } : base
}

/** A theme of only a motion theme: what its files hold. */
export const motionOnlySpec = (preset: MotionPreset): ThemeSpec => applyMotion({}, preset)
