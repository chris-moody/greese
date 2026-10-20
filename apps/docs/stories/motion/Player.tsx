import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, ButtonGroup, Slider, Stack, Text, type Timeline } from '@greese/react'

/**
 * Builds a timeline once its elements mount and renders play/pause/reverse,
 * speed and scrub controls for it. Timelines open paused on their last
 * frame, so stories (and their visual snapshots) show the finished
 * composition; Play starts from the beginning.
 */
export const Player = ({
  build,
  children,
}: {
  build: (root: HTMLElement) => Timeline
  children: ReactNode
}) => {
  const root = useRef<HTMLDivElement>(null)
  const [tl, setTl] = useState<Timeline>()
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    const t = build(root.current!).pause().progress(1)
    setTl(t)
    let frame = 0
    // Follow the playhead for the scrubber without re-rendering per tick.
    const follow = () => {
      setProgress(t.progress())
      frame = requestAnimationFrame(follow)
    }
    frame = requestAnimationFrame(follow)
    return () => {
      cancelAnimationFrame(frame)
      t.kill()
    }
  }, [build])

  return (
    <Stack gap={5}>
      <div ref={root}>{children}</div>
      <Stack gap={3} maxW="28rem">
        <ButtonGroup aria-label="Playback">
          <Button size="sm" onClick={() => tl?.play(tl.progress() >= 1 ? 0 : undefined)}>
            Play
          </Button>
          <Button size="sm" variant="outline" tone="neutral" onClick={() => tl?.pause()}>
            Pause
          </Button>
          <Button
            size="sm"
            variant="outline"
            tone="neutral"
            onClick={() => tl?.reverse()}
          >
            Reverse
          </Button>
        </ButtonGroup>
        <Text size="sm" tone="muted">
          Progress
        </Text>
        <Slider
          aria-label="Progress"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onValueChange={(p) => tl?.pause().progress(p)}
        />
        <Text size="sm" tone="muted">
          Speed: {speed}×
        </Text>
        <Slider
          aria-label="Speed"
          min={0.25}
          max={3}
          step={0.25}
          value={speed}
          onValueChange={(s) => {
            setSpeed(s)
            tl?.timeScale(s)
          }}
        />
      </Stack>
    </Stack>
  )
}
