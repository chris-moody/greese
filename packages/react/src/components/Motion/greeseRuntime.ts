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
import {
  cssPlan,
  effectFrames,
  effectNames,
  isBuiltInEffect,
  jsReach,
  negate,
  parseSequence,
  splitTiming,
  type EffectStep,
  type Timing,
} from '@greese/ui/effects'
import type { GreeseMotion, GreeseOptions } from '../../utils/greese.ts'
import type { GreeseRuntime } from './registry.ts'
import {
  definedEffect,
  type GreeseEffect,
  type GreeseEffectContext,
  type GreeseEffectKeyframes,
  type GreeseEffectWithDefaults,
} from './effects.ts'
import { prefersReducedMotion } from '../../utils/motion.ts'

/**
 * Every built-in effect as plain keyframes, for tools that show or edit them
 * (Theme Studio): the functions resolved at one distance, left to right.
 */
export const describeEffects = (distance = '1rem'): Record<string, Keyframes> =>
  Object.fromEntries(
    effectNames.map((name) => [
      name,
      effectFrames(name, jsReach(distance, false)) as Keyframes,
    ])
  )

export { negate, parseSequence }

/** What one call in a sequence plays: the effect, its timing keys, and its other arguments. */
interface Play {
  effect: GreeseEffect
  timing: Timing
  params: Record<string, string | number>
}

/**
 * A built-in effect, then a defined one. A built-in always does what its name
 * says: `defineGreeseEffect()` can't replace it, so a theme reassigns which
 * effect plays where (ADR 0025) and never rewrites one. The built-ins are
 * `@greese/ui`'s (src/effects.ts), the same ones its CSS is written from, and
 * take the call's arguments; a defined effect takes only the timing keys, plus
 * the arguments it can read from its `args`.
 */
const lookup = (
  name: string,
  args: Record<string, string | number>
): Play | undefined => {
  const { timing, params } = splitTiming(args)
  if (!isBuiltInEffect(name)) {
    const defined = definedEffect(name)
    return defined && { effect: defined, timing, params }
  }
  return {
    effect: ({ distance, rtl }: GreeseEffectContext) =>
      effectFrames(name, jsReach(distance, rtl), params) as Keyframes,
    timing,
    params,
  }
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
  ctx: Omit<GreeseEffectContext, 'el' | 'args'>,
  { duration, ease, options, instant }: Defaults,
  at = 0,
  hold = false
): number => {
  const steps: EffectStep[] = typeof motion === 'string' ? parseSequence(motion) : [[]]
  let held = !hold
  // A reduce, not reassigned locals: each step starts where the last ended.
  return steps.reduce<number>((cursor, step) => {
    if (typeof step === 'number') return Math.max(at, cursor + step)
    // Keyframes given directly are a one-step sequence.
    const plays: Play[] =
      typeof motion === 'string'
        ? step.flatMap(({ name, args }) => {
            const play = lookup(name, args)
            if (!play) console.warn(`greese: no effect named "${name}"`)
            return play ? [play] : []
          })
        : [{ effect: motion, timing: {}, params: {} }]
    const ends = plays.flatMap(({ effect, timing, params }) => {
      const own =
        typeof effect === 'object' && 'keyframes' in effect
          ? (effect as GreeseEffectWithDefaults)
          : undefined
      const kf = own ? own.keyframes : (effect as GreeseEffectKeyframes)
      // A call's own timing wins, then the instance's options, then the effect's.
      const dur = instant
        ? 0
        : (timing.duration ?? options.duration ?? own?.duration ?? duration)
      return targets.map((el, n) => {
        const frames = typeof kf === 'function' ? kf({ ...ctx, el, args: params }) : kf
        // Each target gets its own keyframes (a function may read it), so
        // stagger is applied by offset rather than by greese.js.
        const start =
          cursor + (instant ? 0 : (timing.offset ?? 0) + n * (options.stagger ?? 0))
        if (!held) tl.set(el, firstFrame(frames), 0)
        tl.animate(
          el,
          frames,
          { duration: dur, ease: timing.ease ?? options.ease ?? own?.ease ?? ease },
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
  ctx: Omit<GreeseEffectContext, 'el' | 'args'>
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

/**
 * Whether an element is ready to be revealed, from its box alone: wholly in
 * view and clear of the bottom 10% of the viewport, so it never animates in
 * half cut off; one too tall for that once a fifth of the viewport shows it;
 * and near the end of the page, where it can't scroll clear of that edge,
 * once wholly in view. Not from IntersectionObserver's ratio, which an
 * element's or an ancestor's clip-path (a shape, ADR 0024) lowers for good.
 *
 * A pixel's slack at the page's end: layout is fractional and scrolling
 * whole pixels, so a footer that ends the page can end 0.39px past the
 * viewport (900.39 of 900) and was never wholly in view.
 */
export const isReady = (
  { top, bottom, height }: { top: number; bottom: number; height: number },
  viewport: number,
  left: number
): boolean => {
  const edge = viewport * 0.9
  if (top >= 0 && bottom <= edge) return true
  if (height > viewport * 0.5)
    return Math.min(bottom, viewport) - Math.max(top, 0) >= viewport * 0.2
  return top > -1 && bottom < viewport + 1 && bottom - edge > left - 1
}

const ready = (el: Element): boolean =>
  isReady(
    el.getBoundingClientRect(),
    innerHeight,
    document.documentElement.scrollHeight - scrollY - innerHeight
  )

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
  let frame = 0
  const reveal = () => {
    if (shown) return
    shown = true
    el.dataset.greeseView = 'in'
    play()
    if (o.once !== false) stop()
  }
  // While any of it is in view, its box is checked as the page scrolls (once
  // a frame at most); out of view, nothing runs.
  const check = () => {
    frame = 0
    if (ready(el)) reveal()
  }
  const onScroll = () => {
    frame ||= requestAnimationFrame(check)
  }
  const watch = (on: boolean) => {
    for (const type of ['scroll', 'resize'])
      (on ? addEventListener : removeEventListener)(type, onScroll, {
        passive: true,
      } as never)
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry) return
    watch(entry.isIntersecting)
    if (entry.isIntersecting) check()
    else if (shown && o.once === false) {
      shown = false
      el.dataset.greeseView = 'pending'
      entrance.pause().seek(0)
    }
  })
  const stop = () => {
    observer.disconnect()
    watch(false)
    cancelAnimationFrame(frame)
  }
  observer.observe(el)
  cleanups.push(stop)
}

/** Hover, press and focus: a short paused timeline each, played and reversed. */
const attachInteractions = ({ el, o, ctx, cleanups }: Setup) => {
  /** A short paused timeline of `value` on the element itself, never staggered children. */
  const build = (value: GreeseMotion) => {
    const tl = timeline({ paused: true })
    addMotion(tl, [el], value, ctx, {
      duration: 0.2,
      ease: 'out',
      options: { ...o, stagger: undefined },
    })
    cleanups.push(() => tl.kill())
    return tl
  }
  const interaction = (value: GreeseMotion | undefined, on: string[], off: string[]) => {
    if (!value) return
    const tl = build(value)
    cleanups.push(
      listen(el, on, () => tl.play()),
      listen(el, off, () => tl.reverse())
    )
  }
  if (o.hover) {
    // Hover is for fine pointers: a tap would leave it stuck on touch screens.
    // An effect that moves the element (`rise`, `tilt`) can move it out from
    // under a still pointer, which would leave, settle back under it and enter
    // again, over and over. So hover lasts while the pointer is over where the
    // element rests, not where it has moved to.
    const tl = build(o.hover)
    // Where the element rests, in page coordinates (so a scroll doesn't move
    // it). Measured only at rest, and kept: entering again while it's still
    // settling back must not measure where it has moved to.
    let rest: { left: number; top: number; right: number; bottom: number } | undefined
    const measure = () => {
      const box = el.getBoundingClientRect()
      // A box with no area (nothing laid out) has nothing under the pointer.
      rest =
        box.width * box.height > 0
          ? {
              left: box.left + scrollX,
              top: box.top + scrollY,
              right: box.right + scrollX,
              bottom: box.bottom + scrollY,
            }
          : undefined
    }
    const over = (e: PointerEvent) => {
      const x = e.clientX + scrollX
      const y = e.clientY + scrollY
      return (
        !!rest && x >= rest.left && x <= rest.right && y >= rest.top && y <= rest.bottom
      )
    }
    // While the pointer is off the moved element but over where it rests:
    // leaving that box, the window (no element to go to) or the page's focus
    // ends the hover.
    const watch = (on: boolean) => {
      const toggle = on ? addEventListener : removeEventListener
      toggle('pointermove', onMove)
      toggle('pointerout', onOut)
      toggle('blur', leave)
      toggle('scroll', leave, true)
    }
    const leave = () => {
      watch(false)
      tl.reverse()
    }
    const onMove = (e: PointerEvent) => {
      if (!over(e)) leave()
    }
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) leave()
    }
    cleanups.push(
      listen(el, ['pointerenter'], (e) => {
        if ((e as PointerEvent).pointerType === 'touch') return
        watch(false)
        if (tl.progress() === 0 || !rest) measure()
        tl.play()
      }),
      listen(el, ['pointerleave'], (e) => {
        if (over(e as PointerEvent)) watch(true)
        else leave()
      }),
      () => watch(false)
    )
  }
  interaction(o.press, ['pointerdown'], ['pointerup', 'pointercancel', 'pointerleave'])
  interaction(o.focus, ['focusin'], ['focusout'])
}

/**
 * An overlay's `exit` with an effect defined at run time has no CSS class to
 * set what it changes, so set it here, from the same plan the build makes for
 * the built-ins (`cssPlan()`): the `translate` and `scale` where it ends. The
 * overlay's own exit transition reads them, as it does for a class.
 */
const attachExit = ({ el, o, ctx, cleanups }: Setup) => {
  const defined = o.exit === undefined ? undefined : definedEffect(o.exit)
  if (!defined) return
  const own: GreeseEffectKeyframes =
    typeof defined === 'object' && 'keyframes' in defined
      ? (defined as GreeseEffectWithDefaults).keyframes
      : (defined as GreeseEffectKeyframes)
  const frames = typeof own === 'function' ? own({ ...ctx, el, args: {} }) : own
  for (const [property, value] of Object.entries(cssPlan(frames).exit)) {
    const name = `--greese-motion-exit-${property}`
    el.style.setProperty(name, value)
    cleanups.push(() => el.style.removeProperty(name))
  }
}

/** Attaches every JavaScript-driven part of a `greese` prop; returns the cleanup. */
export const attach = (el: HTMLElement, o: GreeseOptions): (() => void) => {
  const setup: Setup = {
    el,
    o,
    reduce: prefersReducedMotion(el),
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
  attachExit(setup)
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

/**
 * A page's live exit as greese.js (ADR 0029): a sequence for the whole page,
 * or a timeline map, selector → sequence, whose entries start together (each
 * sequence keeps its own pauses and overlaps). `targets` finds a selector's
 * elements in the leaving page; a lone sequence plays on `page`. Resolves
 * when it's over; `cancel` puts every element back, for a navigation that
 * fails. Under reduced motion every effect is a cut.
 */
export const playPageExit: GreeseRuntime['playPageExit'] = (motion, page, targets) => {
  const reduce = prefersReducedMotion(page[0])
  const tl = timeline({ paused: true })
  const entries =
    typeof motion === 'string' ? [[undefined, motion] as const] : Object.entries(motion)
  for (const [selector, sequence] of entries) {
    const els = selector === undefined ? page : targets(selector)
    if (!els.length) continue
    addMotion(
      tl,
      els,
      sequence as GreeseMotion,
      { distance: '1rem', rtl: document.documentElement.dir === 'rtl' },
      { duration: 0.5, options: {}, instant: reduce }
    )
  }
  tl.play()
  return { done: Promise.resolve(tl), cancel: () => tl.kill() }
}
