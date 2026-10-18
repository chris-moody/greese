import { useEffect, useRef, type CSSProperties, type JSX } from 'react'
import {
  Button,
  Card,
  Dialog,
  splitText,
  Stack,
  Text,
  timeline,
  type Timeline,
} from '@greese-ui/react'
import '@greese-ui/react/base.css'
import '@greese-ui/react/styles.css'

declare global {
  interface Window {
    /** The fixture timeline, for e2e/motion.spec.ts to drive. */
    motion?: Timeline
  }
}

/** Fixtures for e2e/motion.spec.ts: greese.js against real computed styles. */
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
        '--greese-color-accent': '#00ff00',
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

      {/* The greese prop (e2e/greese-prop.spec.ts). */}
      <Card data-testid="enter" greese={{ enter: 'fade-up', duration: 10 }}>
        Fades up on load
      </Card>
      <div style={{ '--greese-motion-duration': '7s' } as CSSProperties}>
        <Card data-testid="tuned" greese="fade">
          Tuned by an ancestor
        </Card>
      </div>
      <Stack data-testid="stagger" greese={{ enter: 'fade', stagger: 0.1, duration: 10 }}>
        <span>one</span>
        <span>two</span>
        <span>three</span>
      </Stack>
      <Button data-testid="hover" greese={{ hover: 'lift', press: 'squish' }}>
        Hover me
      </Button>
      <Dialog
        trigger={<Button>Open exit dialog</Button>}
        title="Exit test"
        greese={{ enter: 'scale-in', exit: 'scale-out' }}
      />
      <div style={{ blockSize: '150vh' }} />
      <Card data-testid="reveal" greese={{ inView: 'fade-up', duration: 10 }}>
        Revealed on scroll
      </Card>
      <Text
        data-testid="count-text"
        greese={{ text: 'count', inView: 'fade', duration: 0.3 }}
      >
        2048
      </Text>
    </main>
  )
}
