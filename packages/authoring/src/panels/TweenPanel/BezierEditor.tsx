'use client'
import { useRef, type KeyboardEvent, type PointerEvent, type JSX } from 'react'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import type { BezierControls } from '../../core/types/tween.types.ts'

const W = 120
const H = 120
const PAD = 18

export interface BezierEditorProps {
  value: BezierControls
  onChange: (value: BezierControls) => void
}

/**
 * A cubic-bézier easing editor with two draggable control points (CSS-style;
 * endpoints fixed at 0,0 / 1,1). Y can overshoot [0,1] for anticipation/overshoot.
 */
export const BezierEditor = ({ value, onChange }: BezierEditorProps): JSX.Element => {
  const [x1, y1, x2, y2] = value
  const ref = useRef<SVGSVGElement>(null)

  const sx = (x: number) => PAD + x * W
  const sy = (y: number) => PAD + (1 - y) * H

  const startDrag = (point: 1 | 2) => (event: PointerEvent<SVGCircleElement>) => {
    event.preventDefault()
    beginPointerDrag(event, {
      onMove: (e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        const [nx, ny] = clamp(
          (e.clientX - rect.left - PAD) / W,
          1 - (e.clientY - rect.top - PAD) / H
        )
        onChange(point === 1 ? [nx, ny, x2, y2] : [x1, y1, nx, ny])
      },
    })
  }

  const clamp = (x: number, y: number): [number, number] => [
    Math.max(0, Math.min(1, x)),
    Math.max(-0.5, Math.min(1.5, y)),
  ]
  // Each point is a slider (there's no two-dimensional one in WAI-ARIA):
  // left and right move its time, up and down its value, by 0.01, or 0.1
  // with Shift.
  const onKeyDown = (point: 1 | 2) => (event: KeyboardEvent<SVGCircleElement>) => {
    const step = event.shiftKey ? 0.1 : 0.01
    const by: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowDown: [0, -step],
      ArrowUp: [0, step],
    }
    const move = by[event.key]
    if (!move) return
    event.preventDefault()
    const round = (n: number) => Math.round(n * 1000) / 1000
    const [x, y] = point === 1 ? [x1, y1] : [x2, y2]
    const [nx, ny] = clamp(round(x + move[0]), round(y + move[1]))
    onChange(point === 1 ? [nx, ny, x2, y2] : [x1, y1, nx, ny])
  }
  const pointProps = (point: 1 | 2) => {
    const [x, y] = point === 1 ? [x1, y1] : [x2, y2]
    return {
      role: 'slider',
      tabIndex: 0,
      'aria-label': point === 1 ? 'First control point' : 'Second control point',
      'aria-valuemin': 0,
      'aria-valuemax': 1,
      'aria-valuenow': x,
      'aria-valuetext': `time ${x.toFixed(2)}, value ${y.toFixed(2)}`,
      onKeyDown: onKeyDown(point),
    }
  }

  const path = `M ${sx(0)} ${sy(0)} C ${sx(x1)} ${sy(y1)} ${sx(x2)} ${sy(y2)} ${sx(1)} ${sy(1)}`

  return (
    // eslint-disable-next-line no-restricted-syntax -- the curve editor’s graph, not an icon
    <svg
      ref={ref}
      className={'greese-BezierEditor-editorSvg'}
      width={W + PAD * 2}
      height={H + PAD * 2}
    >
      <rect
        className={'greese-BezierEditor-track'}
        x={PAD}
        y={PAD}
        width={W}
        height={H}
        rx={2}
      />
      <line
        className={'greese-BezierEditor-guideLine'}
        x1={sx(0)}
        y1={sy(0)}
        x2={sx(x1)}
        y2={sy(y1)}
      />
      <line
        className={'greese-BezierEditor-guideLine'}
        x1={sx(1)}
        y1={sy(1)}
        x2={sx(x2)}
        y2={sy(y2)}
      />
      <path className={'greese-BezierEditor-curvePath'} d={path} />
      <circle
        className={'greese-BezierEditor-handle'}
        cx={sx(x1)}
        cy={sy(y1)}
        r={6}
        {...pointProps(1)}
        onPointerDown={startDrag(1)}
      />
      <circle
        className={'greese-BezierEditor-handle'}
        cx={sx(x2)}
        cy={sy(y2)}
        r={6}
        {...pointProps(2)}
        onPointerDown={startDrag(2)}
      />
    </svg>
  )
}
