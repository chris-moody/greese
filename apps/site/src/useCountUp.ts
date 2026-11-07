import { useEffect, useRef, useState, type RefObject } from 'react'
import { ease } from '@greese/js'

const easeOut = ease('out')

/**
 * Counts from 0 up to `target` when the element first scrolls into view, and
 * returns the number for this frame. Under reduced motion it's `target` at
 * once. Put the ref on whatever contains the number.
 */
export const useCountUp = <T extends HTMLElement>(
  target: number,
  seconds = 1.4
): [RefObject<T | null>, number] => {
  const ref = useRef<T>(null)
  const [value, setValue] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setValue(target)
    let frame = 0
    const run = () => {
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / (seconds * 1000))
        setValue(target * easeOut(t))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        run()
      },
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, seconds])
  return [ref, value]
}
