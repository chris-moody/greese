import { useEffect, useRef, type JSX } from 'react'
import { Button, splitText, timeline, type Timeline } from '@sauce-ui/react'
import '@sauce-ui/react/base.css'
import '@sauce-ui/react/styles.css'

declare global {
  interface Window {
    /** The fixture timeline, for e2e/motion.spec.ts to drive. */
    motion?: Timeline
  }
}

/** Fixtures for e2e/motion.spec.ts: sauce.js against real computed styles. */
export const Motion = (): JSX.Element => {
  const box = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLParagraphElement>(null)
  const count = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const { elements, revert } = splitText(label.current!)
    const tl = timeline({ paused: true })
      .to(box.current, {
        x: 50,
        rotate: 90,
        backgroundColor: '#0000ff',
        '--sauce-color-accent': '#00ff00',
        duration: 1,
        ease: 'linear',
      })
      .to(count.current, { text: '100', duration: 1, ease: 'linear' }, 0)
      .from(elements, { opacity: 0, y: 8, duration: 0.2, stagger: 0.05 }, 0)
    window.motion = tl
    return () => {
      tl.kill()
      revert()
    }
  }, [])

  return (
    <main style={{ padding: '1rem' }}>
      <div
        ref={box}
        data-testid="box"
        style={{
          inlineSize: '4rem',
          blockSize: '4rem',
          translate: '10px',
          backgroundColor: 'rgb(255, 0, 0)',
        }}
      >
        <Button size="sm">Accent</Button>
      </div>
      <p ref={label} data-testid="label">
        Hello world
      </p>
      <span ref={count} data-testid="count">
        0
      </span>
    </main>
  )
}
