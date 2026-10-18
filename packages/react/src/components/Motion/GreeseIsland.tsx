'use client'
import { useLayoutEffect, useRef, type JSX, type ReactNode } from 'react'
import type { GreeseOptions, GreeseProp } from '../../utils/greese.ts'
import { Slot } from '../Slot/Slot.tsx'
import { loadGreeseRuntime } from './registry.ts'

const normalize = (prop: GreeseProp): GreeseOptions =>
  typeof prop === 'string' ? { enter: prop } : prop

/** Above the fold right now? Then a scroll reveal would only flash it. */
const inViewport = (el: Element): boolean => {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth
}

/**
 * The client half of the `greese` prop, rendered only when the prop needs
 * JavaScript. It wraps the component's root (through Slot, so no extra
 * element) and hands it to the runtime, which is loaded on demand.
 */
export const GreeseIsland = ({
  greese,
  children,
}: {
  greese: GreeseProp
  children?: ReactNode
}): JSX.Element => {
  const ref = useRef<HTMLElement>(null)
  // The latest options, so a new object each render doesn't re-attach.
  const latest = useRef(greese)
  latest.current = greese
  const key = typeof greese === 'string' ? greese : JSON.stringify(greese)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const options = normalize(latest.current)
    // Hide scroll-reveal targets that are out of view before the first
    // paint; ones already visible are left alone.
    if (options.inView && !inViewport(el)) el.dataset.greeseView = 'pending'
    let detach: (() => void) | undefined
    let live = true
    void loadGreeseRuntime().then((runtime) => {
      if (live) detach = runtime.attach(el, options)
    })
    return () => {
      live = false
      detach?.()
      delete el.dataset.greeseView
    }
  }, [key])

  return <Slot ref={ref}>{children}</Slot>
}
