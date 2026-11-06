'use client'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type DependencyList,
  type RefObject,
} from 'react'
import {
  timeline as createTimeline,
  type AnimateOptions,
  type Keyframes,
  type Targets,
  type Timeline,
  type TimelineOptions,
} from '@greese/js'

/**
 * Animation helpers bound to a component: everything made through them is
 * reverted on unmount, and selector strings only match inside `scope`.
 */
export interface GreeseContext {
  /** A greese.js timeline, tracked. Selectors passed to its methods are scoped. */
  timeline(options?: TimelineOptions): Timeline
  /** Animates and plays at once, like greese.js `animate()`, tracked and scoped. */
  animate(
    targets: Targets,
    keyframes: Keyframes,
    options?: AnimateOptions & TimelineOptions
  ): Timeline
  /** The elements matching `selector` inside `scope` (the whole document without one). */
  select(selector: string): Element[]
}

export interface UseGreeseConfig {
  /** Selector strings only match inside this element. */
  scope?: RefObject<Element | null>
  /** Re-runs the build when these change. @default [] */
  dependencies?: DependencyList
  /**
   * On a dependency change, revert what the previous build made before
   * running it again. Otherwise it's paused where it is, so a new build
   * continues from the current values, and reverted on unmount.
   * @default false
   */
  revertOnUpdate?: boolean
}

export interface UseGreeseResult extends GreeseContext {
  /**
   * Wraps an event handler so it gets the context as its first argument.
   * The helpers are also returned directly; this only reads better inline.
   */
  contextSafe<A extends unknown[], R>(
    fn: (g: GreeseContext, ...args: A) => R
  ): (...args: A) => R
}

// A layout effect, so a build that sets starting values (`from()`, `set()`)
// applies them before the first paint; plain `useEffect` on the server,
// where layout effects warn and nothing animates anyway.
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Kills newest first, so the oldest original values are the ones left standing. */
const revert = (timelines: Timeline[]) => {
  for (const tl of [...timelines].reverse()) tl.revert()
}

interface Recorder {
  api: UseGreeseResult
  /** Runs a build, recording what it makes apart from everything else. */
  build(fn: UseGreeseBuild | undefined): {
    built: Timeline[]
    cleanup: void | (() => void)
  }
  /** Pauses timelines and keeps them, to revert on unmount. */
  keep(timelines: Timeline[]): void
  revertAll(): void
}

/**
 * The context behind the hook: every timeline made through it is recorded,
 * into the running build's list or, from handlers, the kept list.
 */
const createRecorder = (scope: () => Element | undefined): Recorder => {
  const kept: Timeline[] = []
  let building: Timeline[] | undefined
  const g: GreeseContext = {
    timeline: (options) => {
      const tl = createTimeline({ scope: scope(), ...options })
      ;(building ?? kept).push(tl)
      return tl
    },
    animate: (targets, keyframes, options = {}) =>
      g.timeline(options).animate(targets, keyframes, options),
    select: (selector) => [...(scope() ?? document).querySelectorAll(selector)],
  }
  const api: UseGreeseResult = {
    ...g,
    contextSafe:
      (fn) =>
      (...args) =>
        fn(g, ...args),
  }
  return {
    api,
    build(fn) {
      const built: Timeline[] = (building = [])
      try {
        return { built, cleanup: fn?.(api) }
      } finally {
        building = undefined
      }
    },
    keep(timelines) {
      for (const tl of timelines) tl.pause()
      kept.push(...timelines)
    },
    revertAll() {
      revert(kept)
      kept.length = 0
    },
  }
}

/** A `useGreese` build: animate through `g`; may return a cleanup. */
export type UseGreeseBuild = (g: GreeseContext) => void | (() => void)

/**
 * greese.js tied to a component's lifetime. The build runs after
 * mount (refs are set) and before paint, re-runs when dependencies change,
 * and everything it or the returned helpers create is reverted on unmount,
 * including animations started later in event handlers. Strings target
 * elements inside `scope` only, so a component's selectors never reach
 * another instance.
 *
 * ```tsx
 * const root = useRef<HTMLDivElement>(null)
 * const { animate } = useGreese((g) => {
 *   g.timeline().from('.item', { opacity: 0, y: 12, stagger: 0.05 })
 * }, { scope: root })
 * <div ref={root} onClick={() => animate('.item', { scale: [1, 1.05, 1] })}>…</div>
 * ```
 */
export function useGreese(
  build?: UseGreeseBuild,
  config: UseGreeseConfig | DependencyList = {}
): UseGreeseResult {
  const {
    scope,
    dependencies = [],
    revertOnUpdate = false,
  } = Array.isArray(config)
    ? { dependencies: config as DependencyList }
    : (config as UseGreeseConfig)

  const latest = useRef(build)
  latest.current = build
  const scopeRef = useRef(scope)
  scopeRef.current = scope

  // Made once, so the helpers are stable: safe in handlers and in deps.
  const store = useRef<Recorder>(null)
  store.current ??= createRecorder(() => scopeRef.current?.current ?? undefined)
  const recorder = store.current

  // Builds, and on a dependency change pauses or reverts the last build.
  useIsomorphicLayoutEffect(() => {
    const { built, cleanup } = recorder.build(latest.current)
    return () => {
      cleanup?.()
      if (revertOnUpdate) revert(built)
      else recorder.keep(built)
    }
  }, dependencies)

  // Unmount: declared after the build effect, so its cleanup runs after
  // the build's own and sees everything kept.
  useIsomorphicLayoutEffect(() => () => recorder.revertAll(), [])

  return recorder.api
}
