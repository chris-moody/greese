import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { Button, Card, Grid, Stack, Text, useGreese } from '@greese/react'
import { Replay } from '../_shared/Replay.tsx'

const meta = {
  title: 'Motion/useGreese',
  parameters: { layout: 'padded' },
} satisfies Meta
export default meta

type Story = StoryObj

/** One component, rendered twice: `.tile` only ever matches inside its own scope. */
const Tiles = ({ label }: { label: string }) => {
  const root = useRef<HTMLDivElement>(null)
  const { animate } = useGreese(
    (g) => {
      g.timeline().from('.tile', {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: 'back.out(2)',
        stagger: 0.08,
      })
    },
    { scope: root }
  )
  return (
    <Card ref={root}>
      <Stack gap={3}>
        <Text weight="semibold">{label}</Text>
        <Stack direction="row" gap={2}>
          {[1, 2, 3].map((n) => (
            <Card key={n} className="tile" variant="filled" padding={3}>
              {n}
            </Card>
          ))}
        </Stack>
        <div>
          {/* Started in a handler, still tracked: reverted if this unmounts. */}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              animate('.tile', { y: [0, -8, 0] }, { duration: 0.4, stagger: 0.05 })
            }
          >
            Bounce these
          </Button>
        </div>
      </Stack>
    </Card>
  )
}

/**
 * The build runs before paint with refs set, selectors stay inside `scope`,
 * and the returned helpers track animations started later in handlers.
 */
export const Scoped: Story = {
  render: () => (
    <Replay>
      <Grid container minChildWidth="16rem" gap={3}>
        <Tiles label="First instance" />
        <Tiles label="Second instance" />
      </Grid>
    </Replay>
  ),
}

const Follow = () => {
  const [x, setX] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  // Re-runs when x changes. Without revertOnUpdate the last build is paused
  // where it is, so the new one glides on from the current position.
  useGreese(
    (g) => {
      g.timeline().to(box.current, { x, duration: 0.6, ease: 'power3.out' })
    },
    [x]
  )
  return (
    <Stack gap={4}>
      <Stack direction="row" gap={2}>
        {[0, 80, 160].map((value) => (
          <Button
            key={value}
            size="sm"
            variant={x === value ? 'solid' : 'outline'}
            onClick={() => setX(value)}
          >
            {`x: ${value}`}
          </Button>
        ))}
      </Stack>
      <div
        ref={box}
        style={{
          inlineSize: '3rem',
          blockSize: '3rem',
          borderRadius: 'var(--greese-radius-md)',
          background: 'var(--greese-color-primary)',
        }}
      />
    </Stack>
  )
}

/** Dependencies: state drives the animation; click mid-way to see it continue smoothly. */
export const Dependencies: Story = { render: () => <Follow /> }
