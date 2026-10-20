'use client'
import { useLayoutEffect, useRef, type JSX, type ReactNode } from 'react'
import type { GreeseOptions } from '../../utils/greese.ts'
import { Slot } from '../Slot/Slot.tsx'
import { loadGreeseRuntime, loadGreeseScopes } from './registry.ts'

/** Above the fold right now? Then a scroll reveal would only flash it. */
const inViewport = (el: Element): boolean => {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth
}

interface Attachment {
  el: HTMLElement
  options: GreeseOptions
  /** Whether the lazy runtime has anything to do (a scope alone needs none). */
  runtime: boolean
  live: boolean
  detach?: () => void
}

// Islands mounted in one commit are handled together, in a microtask (still
// before paint): every position is read first, then every write is made.
// Measuring each island right after the previous one wrote would force a
// layout per island; a page of animated components paid hundreds.
let batch: Attachment[] = []

const flush = () => {
  const items = batch.filter((a) => a.live)
  batch = []
  const hidden = items.map((a) => a.options.inView !== undefined && !inViewport(a.el))
  // Hide scroll-reveal targets that are out of view; ones already visible
  // are left alone.
  items.forEach((a, i) => {
    if (hidden[i]) a.el.dataset.greeseView = 'pending'
  })
  // Scopes: their entrances wait at the first frame while the start times
  // are set (scope.ts, lazy, or at once when registered), then play.
  const scoped = items.filter((a) => a.options.scope)
  if (scoped.length) {
    for (const a of scoped) a.el.dataset.greeseScope = 'pending'
    void loadGreeseScopes().then((m) => m.attachScopes(scoped.filter((a) => a.live)))
  }
  const needing = items.filter((a) => a.runtime)
  if (needing.length)
    void loadGreeseRuntime().then((runtime) =>
      runtime.attachAll(needing.filter((a) => a.live))
    )
}

const schedule = (attachment: Attachment) => {
  if (!batch.length) queueMicrotask(flush)
  batch.push(attachment)
}

/**
 * The client half of the `greese` prop, rendered only when the prop needs
 * JavaScript. It wraps the component's root (through Slot, so no extra
 * element) and hands it to the runtime, which is loaded on demand.
 */
export const GreeseIsland = ({
  options,
  runtime = true,
  children,
}: {
  /** The `greese` prop, normalized by withGreese. */
  options: GreeseOptions
  /** Whether anything in it needs the lazy runtime. @default true */
  runtime?: boolean
  children?: ReactNode
}): JSX.Element => {
  const ref = useRef<HTMLElement>(null)
  // The latest options, so a new object each render doesn't re-attach.
  const latest = useRef(options)
  latest.current = options
  // Functions (`timeline`) drop out of the key: a new closure each render
  // doesn't re-attach, and the latest one is used when it does.
  const key = JSON.stringify(options)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const attachment: Attachment = { el, options: latest.current, runtime, live: true }
    schedule(attachment)
    return () => {
      attachment.live = false
      attachment.detach?.()
      delete el.dataset.greeseView
    }
  }, [key, runtime])

  return <Slot ref={ref}>{children}</Slot>
}
