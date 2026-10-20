/**
 * The client runtime behind the `greese` prop, loaded only when a prop needs
 * JavaScript (see registry.ts). Everything here is greese.js: scroll reveals,
 * interactions, text effects, keyframe entrances and custom timelines.
 */
import {
  batch,
  splitText,
  timeline,
  type Keyframe,
  type Keyframes,
  type Timeline,
} from '@greese/js'
import type { GreeseMotion, GreeseOptions } from '../../utils/greese.ts'
import type { GreeseRuntime } from './registry.ts'
import {
  definedEffect,
  type GreeseEffect,
  type GreeseEffectContext,
  type GreeseEffectKeyframes,
  type GreeseEffectWithDefaults,
} from './effects.ts'

// Distances are any CSS length. Plain ones (`1rem`, `-12px`) flip textually,
// anything else (`calc(…)`, `var(…)`) through calc(). They end at `0px`:
// greese.js blends mixed units, so `1rem` → `0px` is smooth.
const PLAIN = /^-?[\d.]+[a-z%]*$/i
const ZERO = '0px'
export const negate = (d: string): string =>
  PLAIN.test(d) ? (d.startsWith('-') ? d.slice(1) : `-${d}`) : `calc(-1 * ${d})`
/** Where `fadeStart` comes from: the inline start, which flips in RTL. */
const fromStart = ({ distance, rtl }: GreeseEffectContext) =>
  rtl ? distance : negate(distance)

/**
 * The built-in effects. The entrance presets mirror Motion.scss, for when
 * greese.js plays them (sequences, non-CSS eases, text, timelines).
 */
const BUILT_IN = {
  fadeIn: { opacity: [0, 1] },
  fadeUp: ({ distance: d }) => ({ opacity: [0, 1], y: [d, ZERO] }),
  fadeDown: ({ distance: d }) => ({ opacity: [0, 1], y: [negate(d), ZERO] }),
  fadeStart: (c) => ({ opacity: [0, 1], x: [fromStart(c), ZERO] }),
  fadeEnd: (c) => ({ opacity: [0, 1], x: [negate(fromStart(c)), ZERO] }),
  scaleIn: { opacity: [0, 1], scale: [0.92, 1] },
  blurIn: { opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'] },
  slideUp: { y: ['100%', '0%'] },
  pop: [
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1.04, offset: 0.6 },
    { scale: 1 },
  ],
  fadeOut: { opacity: [1, 0] },
  fadeOutUp: ({ distance: d }) => ({ opacity: [1, 0], y: [ZERO, negate(d)] }),
  fadeOutDown: ({ distance: d }) => ({ opacity: [1, 0], y: [ZERO, d] }),
  scaleOut: { opacity: [1, 0], scale: [1, 0.95] },
  blurOut: { opacity: [1, 0], filter: ['blur(0px)', 'blur(8px)'] },
  lift: { y: [0, -4], scale: [1, 1.02] },
  squish: { scale: [1, 0.96] },
  tilt: { rotate: [0, -2] },
  glow: { filter: ['brightness(1)', 'brightness(1.12)'] },
} satisfies Record<string, GreeseEffect>

/** Every built-in effect name: the source the public name types are checked against. */
export type BuiltInEffect = keyof typeof BUILT_IN

/** A built-in effect, then a defined one. Own keys only, so `constructor` is no effect. */
const lookup = (name: string): GreeseEffect | undefined =>
  Object.hasOwn(BUILT_IN, name) ? BUILT_IN[name as BuiltInEffect] : definedEffect(name)

/** One step of a sequence: effects that play together, or a pause in seconds. */
export type GreeseStep = string[] | number

/**
 * Parses `'fadeIn+scaleIn,+2,fadeOut'`: commas separate steps that play in
 * turn, `+` joins effects that play together, and a number is a pause.
 */
export const parseSequence = (sequence: string): GreeseStep[] => {
  const steps: GreeseStep[] = []
  for (const raw of sequence.split(',')) {
    const step = raw.trim()
    if (/^\+?(\d+\.?\d*|\.\d+)$/.test(step)) steps.push(Number(step))
    else if (step)
      steps.push(
        step
          .split('+')
          .map((s) => s.trim())
          .filter(Boolean)
      )
  }
  return steps
}

interface Defaults {
  duration: number
  ease?: GreeseOptions['ease']
  /** Instance options, which win over an effect's own. */
  options: GreeseOptions
  /** Reduced motion: every effect is a cut, but pauses keep their time. */
  instant?: boolean
}

/**
 * Adds a motion value (effect, sequence or keyframes) to `tl` for `targets`,
 * starting at `at`. With `hold`, the first step's first frames show from 0,
 * so a delayed entrance doesn't flash its end state first. Returns the end.
 */
export const addMotion = (
  tl: Timeline,
  targets: Element[],
  motion: GreeseMotion,
  ctx: Omit<GreeseEffectContext, 'el'>,
  { duration, ease, options, instant }: Defaults,
  at = 0,
  hold = false
): number => {
  const steps: GreeseStep[] = typeof motion === 'string' ? parseSequence(motion) : [[]]
  let held = !hold
  // A reduce, not reassigned locals: each step starts where the last ended.
  return steps.reduce<number>((cursor, step) => {
    if (typeof step === 'number') return cursor + step
    // Keyframes given directly are a one-step sequence.
    const effects: GreeseEffect[] =
      typeof motion === 'string'
        ? step.flatMap((name) => {
            const effect = lookup(name)
            if (!effect) console.warn(`greese: no effect named "${name}"`)
            return effect ? [effect] : []
          })
        : [motion]
    const ends = effects.flatMap((effect) => {
      const own =
        typeof effect === 'object' && 'keyframes' in effect
          ? (effect as GreeseEffectWithDefaults)
          : undefined
      const kf = own ? own.keyframes : (effect as GreeseEffectKeyframes)
      const dur = instant ? 0 : (options.duration ?? own?.duration ?? duration)
      return targets.map((el, n) => {
        const frames = typeof kf === 'function' ? kf({ ...ctx, el }) : kf
        // Each target gets its own keyframes (a function may read it), so
        // stagger is applied by offset rather than by greese.js.
        const start = cursor + (instant ? 0 : n * (options.stagger ?? 0))
        if (!held) tl.set(el, firstFrame(frames), 0)
        tl.animate(
          el,
          frames,
          { duration: dur, ease: options.ease ?? own?.ease ?? ease },
          start
        )
        return start + dur
      })
    })
    held = true
    return Math.max(cursor, ...ends)
  }, at)
}

/** The first frame of keyframes, to show before a delayed entrance starts. */
const firstFrame = (kf: Keyframes): Keyframe => {
  if (Array.isArray(kf)) {
    const { offset: _o, ease: _e, ...values } = kf[0] ?? {}
    return values as Keyframe
  }
  const out: Keyframe = {}
  for (const [prop, v] of Object.entries(kf))
    if (Array.isArray(v) && v.length > 1) out[prop] = v[0]
  return out
}

const VISUALLY_HIDDEN =
  'position:absolute;inline-size:1px;block-size:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap'

/**
 * Text effects animate an aria-hidden copy while assistive technology reads
 * the real text once; the original nodes come back when it ends.
 */
const textEffect = (
  tl: Timeline,
  el: HTMLElement,
  o: GreeseOptions
): (() => void) | undefined => {
  const text = el.textContent ?? ''
  if (el.children.length > 0 || !text.trim()) return undefined
  if (o.text === 'split') {
    const { elements, revert } = splitText(el)
    tl.from(elements, {
      opacity: 0,
      y: 8,
      duration: o.duration ?? 0.4,
      stagger: 0.02,
      ease: o.ease,
    })
    tl.call(revert)
    return revert
  }
  if (o.text === 'count' && !Number.isFinite(Number(text.trim()))) return undefined
  const original = [...el.childNodes]
  const accessible = document.createElement('span')
  accessible.style.cssText = VISUALLY_HIDDEN
  accessible.textContent = text
  const visual = document.createElement('span')
  visual.setAttribute('aria-hidden', 'true')
  el.replaceChildren(accessible, visual)
  const restore = () => el.replaceChildren(...original)
  tl.fromTo(
    visual,
    { text: o.text === 'count' ? '0' : '' },
    {
      text: text.trim(),
      duration:
        o.duration ?? (o.text === 'count' ? 1.2 : Math.min(2, text.length * 0.04)),
      ease: o.ease ?? (o.text === 'count' ? 'out' : 'linear'),
    }
  )
  tl.call(restore)
  return restore
}

/** Adds listeners and returns their removal. */
const listen = (el: HTMLElement, types: string[], fn: (e: Event) => void) => {
  for (const type of types) el.addEventListener(type, fn)
  return () => {
    for (const type of types) el.removeEventListener(type, fn)
  }
}

interface Setup {
  el: HTMLElement
  o: GreeseOptions
  reduce: boolean
  ctx: Omit<GreeseEffectContext, 'el'>
  cleanups: Array<() => void>
}

/**
 * The entrance timeline: whatever CSS isn't already playing (the resolver
 * added a class for that), plus text effects and the custom timeline.
 * Under reduced motion, effects become cuts at once (no delay, no first
 * frame held) while a sequence's pauses still wait, so "show, wait, hide"
 * still shows. A custom timeline can't be cut, so then it all jumps to the end.
 */
const buildEntrance = ({ el, o, reduce, ctx, cleanups }: Setup): Timeline => {
  const entrance = timeline({
    paused: true,
    reducedMotion: reduce && !o.timeline ? 'ignore' : undefined,
  })
  cleanups.push(() => entrance.kill())
  const source = o.inView ?? o.enter
  const cssClass = `greese-Motion--${o.inView !== undefined ? 'view' : 'enter'}-`
  const cssPlays = [...el.classList].some((c) => c.startsWith(cssClass))
  if (source !== undefined && !cssPlays) {
    const targets = o.stagger !== undefined ? [...el.children] : [el]
    const defaults = { duration: 0.5, options: o, instant: reduce }
    addMotion(entrance, targets, source, ctx, defaults, reduce ? 0 : o.delay, !reduce)
  }
  // Under reduced motion the text simply stays as it is.
  if (o.text && !reduce) {
    const undo = textEffect(entrance, el, o)
    if (undo) cleanups.push(undo)
  }
  if (o.timeline) {
    const custom = timeline({ paused: true })
    o.timeline(custom, el)
    entrance.add(custom, 0)
  }
  return entrance
}

/** Steps at which reveal readiness is re-checked as an element scrolls in. */
const REVEAL_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1]

/** Plays the entrance now, or, for `inView`, when the element scrolls into view. */
const startEntrance = ({ el, o, reduce, cleanups }: Setup, entrance: Timeline) => {
  const has = entrance.duration() > 0
  const play = () => {
    if (has) entrance.seek(0).play()
  }
  if (o.inView === undefined) return play()
  // Reduced motion: no waiting to be revealed.
  if (reduce) {
    el.dataset.greeseView = 'in'
    return play()
  }
  if (has) entrance.seek(0)
  let shown = false
  const reveal = () => {
    if (shown) return
    shown = true
    el.dataset.greeseView = 'in'
    play()
    if (o.once !== false) stop()
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return
      // Reveal once the element sits wholly in view, clear of the bottom edge
      // (the root margin), so it never animates in half cut off. One too tall
      // to fit reveals once it fills half the viewport.
      if (
        entry.isIntersecting &&
        (entry.intersectionRatio > 0.99 ||
          entry.intersectionRect.height >= innerHeight / 2)
      )
        reveal()
      else if (!entry.isIntersecting && shown && o.once === false) {
        shown = false
        el.dataset.greeseView = 'pending'
        entrance.pause().seek(0)
      }
    },
    { threshold: REVEAL_THRESHOLDS, rootMargin: '0px 0px -10% 0px' }
  )
  // Near the end of the page, the page may not scroll far enough to lift the
  // element clear of that margin (10% of the viewport): then it reveals once
  // wholly in view.
  const atEnd = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting || entry.intersectionRatio < 0.99) return
      const left = document.documentElement.scrollHeight - scrollY - innerHeight
      if (entry.boundingClientRect.bottom - innerHeight * 0.9 > left) reveal()
    },
    { threshold: 1 }
  )
  const stop = () => {
    observer.disconnect()
    atEnd.disconnect()
  }
  atEnd.observe(el)
  observer.observe(el)
  cleanups.push(stop)
}

/** Hover, press and focus: a short paused timeline each, played and reversed. */
const attachInteractions = ({ el, o, ctx, cleanups }: Setup) => {
  const interaction = (
    value: GreeseMotion | undefined,
    on: string[],
    off: string[],
    accept: (e: Event) => boolean = () => true
  ) => {
    if (!value) return
    const tl = timeline({ paused: true })
    // Interactions move the element itself, never staggered children.
    addMotion(tl, [el], value, ctx, {
      duration: 0.2,
      ease: 'out',
      options: { ...o, stagger: undefined },
    })
    cleanups.push(
      listen(el, on, (e) => {
        if (accept(e)) tl.play()
      }),
      listen(el, off, () => tl.reverse()),
      () => tl.kill()
    )
  }
  // Hover is for fine pointers: a tap would leave it stuck on touch screens.
  interaction(
    o.hover,
    ['pointerenter'],
    ['pointerleave'],
    (e) => (e as PointerEvent).pointerType !== 'touch'
  )
  interaction(o.press, ['pointerdown'], ['pointerup', 'pointercancel', 'pointerleave'])
  interaction(o.focus, ['focusin'], ['focusout'])
}

/** Attaches every JavaScript-driven part of a `greese` prop; returns the cleanup. */
export const attach = (el: HTMLElement, o: GreeseOptions): (() => void) => {
  const setup: Setup = {
    el,
    o,
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    ctx: {
      distance: o.distance ?? '1rem',
      // The dir attribute, as the CSS presets' :dir(rtl) reads it; computed
      // style would force a style recalculation per element.
      rtl: el.closest('[dir]')?.getAttribute('dir') === 'rtl',
    },
    cleanups: [],
  }
  // A reveal that's already in view stays exactly as it is: no entrance is
  // built, so a text effect never swaps out text it won't animate.
  if (o.inView !== undefined && el.dataset.greeseView !== 'pending')
    el.dataset.greeseView = 'in'
  else startEntrance(setup, buildEntrance(setup))
  if (!setup.reduce) attachInteractions(setup)
  return () => {
    for (const cleanup of setup.cleanups.reverse()) cleanup()
  }
}

/**
 * Attaches a commit's worth of elements in one greese.js batch: every
 * element reads its starting values before any of them writes, instead of
 * recalculating styles once per element.
 */
export const attachAll: GreeseRuntime['attachAll'] = (items) =>
  batch(() => {
    for (const item of items) item.detach = attach(item.el, item.options)
  })
