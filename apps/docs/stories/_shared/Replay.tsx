import { useState, type JSX, type ReactNode } from 'react'
import { Button, Stack } from '@greese/react'

/**
 * A Replay button over its children, which it remounts on each click so an
 * animation that plays once can be watched again. Every story or docs demo
 * that shows such an animation wraps it in this (the `greese-conventions`
 * skill's Docs rules). The web app's "Try it" editor has it in scope.
 */
export const Replay = ({
  children,
  align = 'start',
}: {
  children: ReactNode
  /** Where the button and the demo sit across the canvas. */
  align?: 'start' | 'center'
}): JSX.Element => {
  const [key, setKey] = useState(0)
  return (
    <Stack gap={4} align={align}>
      <div>
        <Button
          size="sm"
          variant="outline"
          tone="neutral"
          onClick={() => setKey((k) => k + 1)}
        >
          Replay
        </Button>
      </div>
      <div key={key}>{children}</div>
    </Stack>
  )
}
