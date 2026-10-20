import { ease as toEase, type Ease, type EaseFn } from './ease.ts'
import {
  adapterFor,
  flushAdapter,
  toTargets,
  type Adapter,
  type Target,
  type Targets,
} from './target.ts'
import { addToTicker, removeFromTicker } from './ticker.ts'
import type { Mixer, Value } from './value.ts'

/**
 * Where a child goes in a timeline, in seconds:
 *
 * - a number: that time;
 * - `'+=0.2'` / `'-=0.2'`: relative to the timeline's current end;
 * - `'<'` / `'>'`: the start / end of the previously added child, optionally
 *   offset (`'<0.1'`, `'>-0.2'`);
 * - a label, optionally offset (`'intro'`, `'intro+=0.5'`).
 *
 * Omitted: the timeline's end, so calls run in sequence.
 */
export type Position = number | string

type Prop = Value | undefined

/** A keyframe: property values, plus optional `offset` (0–1) and `ease`. */
export interface Keyframe {
  [prop: string]: Prop | Ease
  offset?: number
  ease?: Ease
}

/**
 * Keyframes, WAAPI-style: an array of frames, or an object of property →
 * value list (`{ opacity: [0, 1], x: [0, 40, 20] }`). A single value or
 * frame animates from the current value.
 */
export type Keyframes = Keyframe[] | { [prop: string]: Prop | Prop[] }

/** Property values plus animation options, for `to`, `from` and `fromTo`. */
export type Vars = { [prop: string]: Prop | Ease | StaggerOptions } & AnimateOptions

export interface StaggerOptions {
  /** Seconds between neighbouring targets. */
  each: number
  /** Where the wave starts. @default 'start' */
  from?: 'start' | 'end' | 'center' | number
}

export interface AnimateOptions {
  /** Seconds. @default 0.5 */
  duration?: number
  /** @default 'out' (power2.out) */
  ease?: Ease
  /** Offsets each target's start, in seconds, or `{ each, from }`. */
  stagger?: number | StaggerOptions
}

export interface TimelineOptions {
  /** Don't start until `play()`. @default false */
  paused?: boolean
  /** Extra plays after the first; `-1` repeats forever. @default 0 */
  repeat?: number
  /** Every other repeat plays backwards. */
  yoyo?: boolean
  /** Seconds between repeats. */
  repeatDelay?: number
  /** Speed multiplier: 2 is twice as fast. @default 1 */
  timeScale?: number
  /**
   * With the user's `prefers-reduced-motion: reduce`, a playing timeline
   * jumps to its end. `'ignore'` plays it anyway; keep that for motion that
   * carries meaning (a progress indicator), not decoration.
   * @default 'reduce'
   */
  reducedMotion?: 'reduce' | 'ignore'
  /** Selector strings passed to this timeline match only inside this element. */
  scope?: ParentNode
  onUpdate?: (timeline: Timeline) => void
  onComplete?: (timeline: Timeline) => void
}

const OPTION_KEYS = new Set(['duration', 'ease', 'stagger', 'offset'])

/** One property's interpolation from `start` to `end` (seconds). */
interface Segment {
  start: number
  end: number
  /** Explicit start value; unset means "whatever the property is at `start`". */
  from?: Value
  /** Explicit end value; unset means "what it was before" (from-tweens). */
  to?: Value
  ease: EaseFn
  /** Show `from` before `start` (from-tweens), so nothing flashes. */
  immediate?: boolean
  mixer?: Mixer
}

/**
 * One property of one target over a timeline: segments in start order,
 * sampled purely by time, so seeking anywhere, in either direction, gives the
 * same result. Before the first segment it holds the property's original
 * value; between segments it holds the last end value.
 */
class Track {
  segments: Segment[] = []
  base?: Value
  /** Whether this track has written since the playhead was before it. */
  live = false

  constructor(
    readonly adapter: Adapter,
    readonly prop: string
  ) {}

  add(segment: Segment) {
    this.segments.push(segment)
    this.segments.sort((a, b) => a.start - b.start)
  }

  private original(): Value {
    return (this.base ??= this.adapter.get(this.prop))
  }

  /** The value just before segment `i` starts. */
  private before(i: number): Value {
    return i > 0 ? this.valueOf(i - 1, this.segments[i]!.start) : this.original()
  }

  private valueOf(i: number, time: number): Value {
    const s = this.segments[i]!
    if (!s.mixer) {
      const from = s.from ?? this.before(i)
      s.mixer = this.adapter.mixer(this.prop, from, s.to ?? this.before(i))
    }
    const span = s.end - s.start
    const t =
      span > 0
        ? Math.min(1, Math.max(0, (time - s.start) / span))
        : time >= s.start
          ? 1
          : 0
    return s.mixer(t >= 1 ? 1 : s.ease(t))
  }

  /** The value at `time`, or undefined when the track shouldn't write. */
  sample(time: number): Value | undefined {
    let i = -1
    for (let k = 0; k < this.segments.length && this.segments[k]!.start <= time; k++)
      i = k
    if (i < 0) {
      const first = this.segments[0]!
      if (first.immediate) return this.firstWrite(this.valueOf(0, first.start))
      // Not started: leave the property alone, but restore it once when the
      // playhead moves back before the track (a rewind or seek).
      if (!this.live) return undefined
      this.live = false
      return this.original()
    }
    this.live = true
    return this.firstWrite(this.valueOf(i, time))
  }

  /**
   * Reads the original before the first write, even when every value was
   * given explicitly and none was needed, so `kill()` can restore it.
   */
  private firstWrite(value: Value): Value {
    this.original()
    return value
  }

  invalidate() {
    this.base = undefined
    for (const s of this.segments) s.mixer = undefined
  }
}

interface Child {
  start: number
  timeline?: Timeline
  call?: () => void
}

const staggerOffset = (
  stagger: AnimateOptions['stagger'],
  i: number,
  n: number
): number => {
  if (!stagger) return 0
  const { each, from = 'start' } =
    typeof stagger === 'number' ? { each: stagger } : stagger
  const origin =
    from === 'start' ? 0 : from === 'end' ? n - 1 : from === 'center' ? (n - 1) / 2 : from
  return each * Math.abs(i - origin)
}

/** Fills missing keyframe offsets evenly between known ones, as WAAPI does. */
const offsets = (frames: Keyframe[]): number[] => {
  const out = frames.map((f) => f.offset)
  out[0] ??= frames.length === 1 ? 1 : 0
  out[out.length - 1] ??= 1
  for (let i = 1; i < out.length - 1; i++) {
    if (out[i] !== undefined) continue
    let j = i
    while (out[j] === undefined) j++
    const a = out[i - 1]!
    for (let k = i; k < j; k++) out[k] = a + ((out[j]! - a) * (k - i + 1)) / (j - i + 1)
  }
  return out as number[]
}

/** Keyframes as one stop list per property: `[offset, value, ease]`. */
type Stop = [offset: number, value: Prop, ease?: Ease]

const toStops = (keyframes: Keyframes): Map<string, Stop[]> => {
  const stops = new Map<string, Stop[]>()
  const push = (prop: string, stop: Stop) => {
    if (!stops.has(prop)) stops.set(prop, [])
    stops.get(prop)!.push(stop)
  }
  if (Array.isArray(keyframes)) {
    const at = offsets(keyframes)
    keyframes.forEach((frame, i) => {
      for (const prop in frame) {
        if (!OPTION_KEYS.has(prop)) push(prop, [at[i]!, frame[prop] as Prop, frame.ease])
      }
    })
  } else {
    for (const prop in keyframes) {
      if (OPTION_KEYS.has(prop)) continue
      const list = ([] as Prop[]).concat(keyframes[prop])
      list.forEach((v, i) =>
        push(prop, [list.length === 1 ? 1 : i / (list.length - 1), v])
      )
    }
  }
  // A first stop after 0 starts from the current value.
  for (const list of stops.values()) if (list[0]![0] > 0) list.unshift([0, undefined])
  return stops
}

/**
 * A timeline: animations, callbacks and other timelines placed in time.
 * Rendering is a pure function of time (`seek` anywhere, any order), so
 * playing, reversing, scaling time and nesting are all just ways of choosing
 * which time to render. Only top-level timelines run a clock.
 *
 * ```ts
 * const intro = timeline()
 *   .to('.title', { opacity: 1, y: 0, duration: 0.6 })
 *   .from('.card', { opacity: 0, y: 24, stagger: 0.08 }, '-=0.3')
 *
 * timeline({ repeat: -1, yoyo: true }).add(intro).timeScale(2)
 * ```
 */
export class Timeline implements PromiseLike<void> {
  #options: TimelineOptions
  #tracks = new Map<Target, Map<string, Track>>()
  #children: Child[] = []
  #labels: Record<string, number> = {}
  #previous = { start: 0, end: 0 }
  #time_ = 0
  #local = 0
  #scale: number
  #direction: 1 | -1 = 1
  #playing = false
  /** Set by any explicit control call, which cancels the default autoplay. */
  #controlled = false
  #parent?: Timeline
  #settle?: () => void
  #done?: Promise<void>

  constructor(options: TimelineOptions = {}) {
    this.#options = options
    this.#scale = options.timeScale ?? 1
    // Starts on the next frame, after the chained calls that fill it.
    if (!options.paused) queueMicrotask(() => !this.#controlled && this.play())
  }

  // --- building ---------------------------------------------------------

  /** Animates through keyframes. See {@link Keyframes}. */
  animate(
    targets: Targets,
    keyframes: Keyframes,
    options: AnimateOptions = {},
    position?: Position
  ): this {
    const list = toTargets(targets, this.#options.scope)
    // `to()` passes its options inside the keyframe object.
    const inline = (Array.isArray(keyframes) ? {} : keyframes) as AnimateOptions
    const duration = options.duration ?? inline.duration ?? 0.5
    const optEase = options.ease ?? inline.ease
    const stagger = options.stagger ?? inline.stagger
    const at = this.#resolve(position)
    const stops = toStops(keyframes)
    let end = at
    list.forEach((target, i) => {
      const start = at + staggerOffset(stagger, i, list.length)
      end = Math.max(end, start + duration)
      for (const [prop, list] of stops) {
        for (let k = 0; k + 1 < list.length; k++) {
          const [o1, v1, e1] = list[k]!
          const [o2, v2] = list[k + 1]!
          this.#track(target, prop).add({
            start: start + o1 * duration,
            end: start + o2 * duration,
            from: v1,
            to: v2,
            ease: toEase(e1 ?? optEase),
          })
        }
      }
    })
    this.#placed(at, end)
    return this
  }

  /** Animates from the current values to `vars`. */
  to(targets: Targets, vars: Vars, position?: Position): this {
    return this.animate(targets, vars as Keyframes, {}, position)
  }

  /** Animates from `vars` to the current values; `vars` show until it starts. */
  from(targets: Targets, vars: Vars, position?: Position): this {
    const { duration, ease, stagger, ...from } = vars
    return this.fromTo(targets, from as Keyframe, { duration, ease, stagger }, position)
  }

  /** Animates from `fromVars` to `toVars` (options go on `toVars`). */
  fromTo(targets: Targets, fromVars: Keyframe, toVars: Vars, position?: Position): this {
    const { duration = 0.5, ease, stagger } = toVars
    const list = toTargets(targets, this.#options.scope)
    const at = this.#resolve(position)
    let end = at
    list.forEach((target, i) => {
      const start = at + staggerOffset(stagger, i, list.length)
      end = Math.max(end, start + duration)
      for (const prop in fromVars) {
        if (OPTION_KEYS.has(prop)) continue
        this.#track(target, prop).add({
          start,
          end: start + duration,
          from: fromVars[prop] as Prop,
          to: toVars[prop] as Prop,
          ease: toEase(ease),
          immediate: true,
        })
      }
    })
    this.#placed(at, end)
    if (this.#time_ === 0) this.render(0)
    return this
  }

  /** Sets values at a point in time (a zero-length animation). */
  set(targets: Targets, vars: Keyframe, position?: Position): this {
    return this.animate(targets, vars as Keyframes, { duration: 0 }, position)
  }

  /**
   * Nests a timeline, or schedules a callback. A nested timeline stops
   * running its own clock: this one drives it, through its own repeat,
   * yoyo and time scale.
   */
  add(child: Timeline | (() => void), position?: Position): this {
    const start = this.#resolve(position)
    if (child instanceof Timeline) {
      child.#parent = this
      child.pause()
      this.#children.push({ start, timeline: child })
      this.#placed(start, start + child.#span())
    } else {
      this.#children.push({ start, call: child })
      this.#placed(start, start)
    }
    return this
  }

  /** Runs `fn` when the playhead passes `position`, in either direction. */
  call(fn: () => void, position?: Position): this {
    return this.add(fn, position)
  }

  /** Names a point in time, for positions and `seek`. */
  label(name: string, position?: Position): this {
    this.#labels[name] = this.#resolve(position)
    return this
  }

  // --- timing -----------------------------------------------------------

  /** Seconds in one play-through (without repeats). */
  duration(): number {
    let end = 0
    for (const props of this.#tracks.values())
      for (const track of props.values())
        for (const s of track.segments) end = Math.max(end, s.end)
    for (const c of this.#children)
      end = Math.max(end, c.start + (c.timeline ? c.timeline.#span() : 0))
    return end
  }

  /** Seconds including repeats and repeat delays; `Infinity` for `repeat: -1`. */
  totalDuration(): number {
    const { repeat = 0, repeatDelay = 0 } = this.#options
    if (repeat < 0) return Infinity
    return this.duration() * (repeat + 1) + repeatDelay * repeat
  }

  /** Length in a parent's time: total duration over time scale. */
  #span(): number {
    const total = this.totalDuration()
    return total === Infinity ? this.duration() / this.#scale : total / this.#scale
  }

  /** Gets or sets the speed multiplier. */
  timeScale(): number
  timeScale(value: number): this
  timeScale(value?: number): number | this {
    if (value === undefined) return this.#scale
    this.#scale = Math.max(1e-6, value)
    return this
  }

  /** Gets the playhead (total time, seconds), or moves it without callbacks. */
  time(): number
  time(value: number): this
  time(value?: number): number | this {
    if (value === undefined) return this.#time_
    this.#controlled = true
    this.render(value, true)
    return this
  }

  /** Gets or sets progress through the whole timeline, `0`–`1`. */
  progress(): number
  progress(value: number): this
  progress(value?: number): number | this {
    const total = this.totalDuration()
    const finite = total === Infinity ? this.duration() : total
    if (value === undefined) return finite ? Math.min(1, this.#time_ / finite) : 1
    return this.time(value * finite)
  }

  /** Moves the playhead to a time or label, without firing callbacks. */
  seek(position: Position): this {
    return this.time(typeof position === 'number' ? position : this.#resolve(position))
  }

  // --- playback ---------------------------------------------------------

  /** Plays forwards, optionally from a time or label. */
  play(from?: Position): this {
    if (from !== undefined) this.seek(from)
    return this.#start(1)
  }

  /** Plays backwards from the playhead (from the end if at the start). */
  reverse(from?: Position): this {
    if (from !== undefined) this.seek(from)
    else if (this.#time_ === 0)
      this.seek(
        this.totalDuration() === Infinity ? this.duration() : this.totalDuration()
      )
    return this.#start(-1)
  }

  pause(): this {
    this.#controlled = true
    this.#playing = false
    removeFromTicker(this)
    return this
  }

  /** Continues in the current direction. */
  resume(): this {
    return this.#start(this.#direction)
  }

  restart(): this {
    return this.play(0)
  }

  /** Whether the timeline's clock is running. */
  isActive(): boolean {
    return this.#playing
  }

  /** Stops, and restores every animated property to its original value. */
  kill(): this {
    this.pause()
    for (const props of this.#tracks.values()) {
      for (const track of props.values()) {
        if (track.base !== undefined) track.adapter.set(track.prop, track.base)
        track.invalidate()
      }
    }
    this.#flush()
    for (const c of this.#children) c.timeline?.kill()
    return this
  }

  /** Re-reads original and current values on the next render. */
  invalidate(): this {
    for (const props of this.#tracks.values())
      for (const track of props.values()) track.invalidate()
    for (const c of this.#children) c.timeline?.invalidate()
    return this
  }

  /**
   * Resolves when the timeline completes (either direction), or at once if
   * it already has: `await timeline().to(…)`. Resolves with no value: a
   * timeline resolving to itself would be awaited again, forever.
   */
  then<A = void, B = never>(
    onfulfilled?: ((value: void) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    const finished = this.#direction > 0 ? this.totalDuration() : 0
    if (!this.#playing && this.#controlled && this.#time_ === finished) {
      return Promise.resolve().then(onfulfilled, onrejected)
    }
    this.#done ??= new Promise<void>((resolve) => (this.#settle = resolve))
    return this.#done.then(onfulfilled, onrejected)
  }

  #start(direction: 1 | -1): this {
    this.#controlled = true
    if (this.#parent) return this
    this.#direction = direction
    const end = this.totalDuration()
    const reduce =
      this.#options.reducedMotion !== 'ignore' &&
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      this.render(direction > 0 ? (end === Infinity ? this.duration() : end) : 0, true)
      this.#complete()
      return this
    }
    this.#playing = true
    addToTicker(this)
    return this
  }

  /** Advances by `dt` real seconds. Called by the ticker. */
  tick(dt: number): void {
    const end = this.totalDuration()
    const next = this.#time_ + dt * this.#scale * this.#direction
    if (this.#direction > 0 && next >= end) {
      this.render(end)
      this.#complete()
    } else if (this.#direction < 0 && next <= 0) {
      this.render(0)
      this.#complete()
    } else this.render(next)
  }

  #complete() {
    this.pause()
    this.#options.onComplete?.(this)
    this.#settle?.()
    this.#done = this.#settle = undefined
  }

  // --- rendering --------------------------------------------------------

  /**
   * Renders the timeline at a total time: maps it through repeat, delay and
   * yoyo to a time within one play-through, samples every track, then
   * renders nested timelines at their own times.
   */
  render(totalTime: number, seeking = false): void {
    const total = this.totalDuration()
    const time = Math.max(0, Math.min(totalTime, total))
    const { repeat = 0, repeatDelay = 0, yoyo } = this.#options
    const length = this.duration()
    const period = length + repeatDelay
    let iteration = period > 0 ? Math.floor(time / period) : 0
    if (repeat >= 0) iteration = Math.min(iteration, repeat)
    let local = Math.min(length, time - iteration * period)
    if (yoyo && iteration % 2 === 1) local = length - local
    const before = this.#local
    this.#time_ = time
    this.#local = local

    for (const props of this.#tracks.values()) {
      for (const track of props.values()) {
        const value = track.sample(local)
        if (value !== undefined) track.adapter.set(track.prop, value)
      }
    }
    this.#flush()

    for (const child of this.#children) {
      if (child.timeline) {
        const t = child.timeline
        t.render(Math.max(0, (local - child.start) * t.#scale), seeking)
      } else if (!seeking) {
        const crossed =
          (before < child.start && local >= child.start) ||
          (before > child.start && local <= child.start)
        if (crossed) child.call!()
      }
    }
    this.#options.onUpdate?.(this)
  }

  #flush() {
    for (const props of this.#tracks.values())
      flushAdapter(props.values().next().value!.adapter)
  }

  #track(target: Target, prop: string): Track {
    let props = this.#tracks.get(target)
    if (!props) this.#tracks.set(target, (props = new Map()))
    let track = props.get(prop)
    if (!track) props.set(prop, (track = new Track(adapterFor(target), prop)))
    return track
  }

  #placed(start: number, end: number) {
    this.#previous = { start, end }
  }

  #resolve(position: Position | undefined): number {
    const end = this.duration()
    if (position === undefined) return end
    if (typeof position === 'number') return position
    const s = position.trim()
    if (s[0] === '<' || s[0] === '>') {
      const base = s[0] === '<' ? this.#previous.start : this.#previous.end
      return base + (parseFloat(s.slice(1).replace('=', '')) || 0)
    }
    // `name`, `name+=n`, `+=n`, `-=n`. Labels can't contain + or -.
    const m = /^([^+-]*)(?:([+-])=(\d*\.?\d+))?$/.exec(s)
    if (!m) throw new Error(`greese: bad position "${position}"`)
    const offset = m[3] ? Number(m[3]) * (m[2] === '-' ? -1 : 1) : 0
    return (m[1] ? (this.#labels[m[1]] ??= end) : end) + offset
  }
}

/** A new timeline. It plays on the next frame unless `paused`. */
export const timeline = (options?: TimelineOptions): Timeline => new Timeline(options)

/**
 * Animates targets through keyframes and plays at once: the one-call API.
 *
 * ```ts
 * animate('.card', { opacity: [0, 1], y: [16, 0] }, { duration: 0.4, stagger: 0.05 })
 * animate(el, [{ scale: 1 }, { scale: 1.1, offset: 0.3 }, { scale: 1 }], { repeat: -1 })
 * ```
 */
export const animate = (
  targets: Targets,
  keyframes: Keyframes,
  options: AnimateOptions & TimelineOptions = {}
): Timeline => new Timeline(options).animate(targets, keyframes, options)
