import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react'
import {
  Button,
  Card,
  Dialog,
  splitText,
  Stack,
  Text,
  timeline,
  useGreese,
  type Timeline,
} from '@greese/react'
import '@greese/react/base.css'
import '@greese/react/styles.css'

declare global {
  interface Window {
    /** The fixture timeline, for e2e/motion.spec.ts to drive. */
    motion?: Timeline
    /** Mixed-unit fixture: px → rem token, px → vw width. */
    units?: Timeline
  }
}

/** A useGreese user: a scoped selector entrance and a handler animation. */
const HookList = ({ id }: { id: string }) => {
  const root = useRef<HTMLDivElement>(null)
  const { animate } = useGreese(
    (g) => {
      g.timeline().from('.hook-item', { opacity: 0, duration: 10, ease: 'linear' })
    },
    { scope: root }
  )
  return (
    <div ref={root} data-testid={id}>
      <span className="hook-item">{id}</span>
      <Button
        size="sm"
        onClick={() => animate('.hook-item', { scale: [1, 1.5] }, { duration: 0.1 })}
      >
        {`Pulse ${id}`}
      </Button>
    </div>
  )
}

const HookFixture = () => {
  const [mounted, setMounted] = useState(true)
  return (
    <Stack direction="row" gap={2}>
      {mounted && <HookList id="hook-a" />}
      <HookList id="hook-b" />
      <Button size="sm" onClick={() => setMounted(false)}>
        Unmount hook-a
      </Button>
    </Stack>
  )
}

/** Fixtures for e2e/motion.spec.ts: greese.js against real computed styles. */
export const Motion = (): JSX.Element => {
  const box = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLParagraphElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const unitsBox = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { elements, revert } = splitText(label.current!)
    const tl = timeline({ paused: true })
      .to(box.current, {
        x: 50,
        rotate: 90,
        backgroundColor: '#0000ff',
        '--greese-color-primary': '#00ff00',
        duration: 1,
        ease: 'linear',
      })
      .to(count.current, { text: '100', duration: 1, ease: 'linear' }, 0)
      .from(elements, { opacity: 0, y: 8, duration: 0.2, stagger: 0.05 }, 0)
    window.motion = tl
    window.units = timeline({ paused: true }).to(unitsBox.current, {
      '--greese-radius-lg': '2rem',
      width: '50vw',
      duration: 1,
      ease: 'linear',
    })
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
        <Button size="sm">Primary</Button>
      </div>
      <div
        ref={unitsBox}
        data-testid="units"
        style={{
          inlineSize: '100px',
          blockSize: '2rem',
          borderRadius: 'var(--greese-radius-lg)',
          background: 'var(--greese-color-primary)',
        }}
      />
      <p ref={label} data-testid="label">
        Hello world
      </p>
      <span ref={count} data-testid="count">
        0
      </span>

      {/* useGreese (e2e/motion.spec.ts). */}
      <HookFixture />

      {/* The greese prop (e2e/greese-prop.spec.ts). */}
      <Card data-testid="enter" greese={{ enter: 'fadeUp', duration: 10 }}>
        Fades up on load
      </Card>
      <div style={{ '--greese-motion-duration': '7s' } as CSSProperties}>
        <Card data-testid="tuned" greese="fadeIn">
          Tuned by an ancestor
        </Card>
      </div>
      <Stack
        data-testid="stagger"
        greese={{ enter: 'fadeIn', stagger: 0.1, duration: 10 }}
      >
        <span>one</span>
        <span>two</span>
        <span>three</span>
      </Stack>
      <Card
        data-testid="sequence"
        greese={{ enter: 'fadeIn+scaleIn,+1.5,fadeOut', duration: 0.3 }}
      >
        In together, wait, out
      </Card>
      <Button data-testid="hover" greese={{ hover: 'lift', press: 'squish' }}>
        Hover me
      </Button>
      <Dialog
        trigger={<Button>Open exit dialog</Button>}
        title="Exit test"
        greese={{ enter: 'scaleIn', exit: 'scaleOut' }}
      />
      <div style={{ blockSize: '150vh' }} />
      <Card data-testid="reveal" greese={{ inView: 'fadeUp', duration: 10 }}>
        Revealed on scroll
      </Card>
      <Text
        data-testid="count-text"
        greese={{ text: 'count', inView: 'fadeIn', duration: 0.3 }}
      >
        2048
      </Text>
    </main>
  )
}
