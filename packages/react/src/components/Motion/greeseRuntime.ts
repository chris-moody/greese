/**
 * The client runtime behind the `greese` prop, loaded only when a prop needs
 * JavaScript (see registry.ts). Everything here is greese.js: scroll reveals,
 * interactions, text effects, keyframe entrances and custom timelines.
 */
import {
  splitText,
  timeline,
  type Keyframe,
  type Keyframes,
  type Timeline,
} from '@greese-ui/greese'
import type {
  GreeseInteraction,
  GreeseOptions,
  GreesePreset,
} from '../../utils/greese.ts'

const zero = (d: string) => d.replace(/-?\d*\.?\d+/, '0')
const negate = (d: string) => (d.startsWith('-') ? d.slice(1) : `-${d}`)

/** The CSS presets as keyframes, for when greese.js plays them (non-CSS eases, text, timelines). */
const presetKeyframes = (
  preset: GreesePreset,
  distance: string,
  rtl: boolean
): Keyframes => {
  const start = rtl ? distance : negate(distance)
  switch (preset) {
    case 'fade':
      return { opacity: [0, 1] }
    case 'fade-up':
      return { opacity: [0, 1], y: [distance, zero(distance)] }
    case 'fade-down':
      return { opacity: [0, 1], y: [negate(distance), zero(distance)] }
    case 'fade-start':
      return { opacity: [0, 1], x: [start, zero(distance)] }
    case 'fade-end':
      return { opacity: [0, 1], x: [negate(start), zero(distance)] }
    case 'scale-in':
      return { opacity: [0, 1], scale: [0.92, 1] }
    case 'blur-in':
      return { opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'] }
    case 'slide-up':
      return { y: ['100%', '0%'] }
    case 'pop':
      return [
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1.04, offset: 0.6 },
        { scale: 1 },
      ]
  }
}

const INTERACTIONS: Record<GreeseInteraction, Keyframes> = {
  lift: { y: [0, -4], scale: [1, 1.02] },
  squish: { scale: [1, 0.96] },
  tilt: { rotate: [0, -2] },
  glow: { filter: ['brightness(1)', 'brightness(1.12)'] },
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

/** Attaches every JavaScript-driven part of a `greese` prop; returns the cleanup. */
export const attach = (el: HTMLElement, o: GreeseOptions): (() => void) => {
  const cleanups: Array<() => void> = []
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const rtl = getComputedStyle(el).direction === 'rtl'
  const distance = o.distance ?? '1rem'
  const targets = o.stagger !== undefined ? [...el.children] : [el]
  const options = { duration: o.duration ?? 0.5, ease: o.ease, stagger: o.stagger }

  // Entrance: whatever CSS isn't already playing (the resolver added a class
  // for that), plus text effects and the custom timeline.
  const entrance = timeline({ paused: true })
  const source = o.inView ?? o.enter
  const cssPlays =
    (o.inView !== undefined &&
      el.classList.contains(`greese-Motion--view-${o.inView}`)) ||
    (o.inView === undefined && el.classList.contains(`greese-Motion--enter-${o.enter}`))
  if (source !== undefined && !cssPlays) {
    const kf =
      typeof source === 'string' ? presetKeyframes(source, distance, rtl) : source
    entrance.set(targets, firstFrame(kf), 0).animate(targets, kf, options, o.delay ?? 0)
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
  const hasEntrance = entrance.duration() > 0
  const play = () => {
    if (hasEntrance) entrance.seek(0).play()
  }
  cleanups.push(() => entrance.kill())

  // Scroll reveal: elements that started out of view wait for the observer.
  if (o.inView !== undefined) {
    if (el.dataset.greeseView !== 'pending' || reduce) {
      el.dataset.greeseView = 'in'
      if (reduce) play()
    } else {
      if (hasEntrance) entrance.seek(0)
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            el.dataset.greeseView = 'in'
            play()
            if (o.once !== false) observer.disconnect()
          } else if (o.once === false) {
            el.dataset.greeseView = 'pending'
            entrance.pause().seek(0)
          }
        },
        { threshold: 0.15 }
      )
      observer.observe(el)
      cleanups.push(() => observer.disconnect())
    }
  } else {
    play()
  }

  // Interactions: a short paused timeline each, played and reversed.
  if (!reduce) {
    const interaction = (
      value: GreeseInteraction | Keyframes | undefined,
      on: string[],
      off: string[],
      accept: (e: Event) => boolean = () => true
    ) => {
      if (!value) return
      const kf = typeof value === 'string' ? INTERACTIONS[value] : value
      const tl = timeline({ paused: true }).animate(el, kf, {
        duration: o.duration ?? 0.2,
        ease: o.ease ?? 'out',
      })
      const start = (e: Event) => accept(e) && tl.play()
      const end = () => tl.reverse()
      for (const type of on) el.addEventListener(type, start)
      for (const type of off) el.addEventListener(type, end)
      cleanups.push(() => {
        for (const type of on) el.removeEventListener(type, start)
        for (const type of off) el.removeEventListener(type, end)
        tl.kill()
      })
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

  return () => {
    for (const cleanup of cleanups.reverse()) cleanup()
  }
}
