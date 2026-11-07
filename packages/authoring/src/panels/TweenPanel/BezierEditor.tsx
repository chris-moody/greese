import { useRef, type PointerEvent, type JSX } from 'react'
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
        const nx = Math.max(0, Math.min(1, (e.clientX - rect.left - PAD) / W))
        const ny = Math.max(-0.5, Math.min(1.5, 1 - (e.clientY - rect.top - PAD) / H))
        onChange(point === 1 ? [nx, ny, x2, y2] : [x1, y1, nx, ny])
      },
    })
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
        onPointerDown={startDrag(1)}
      />
      <circle
        className={'greese-BezierEditor-handle'}
        cx={sx(x2)}
        cy={sy(y2)}
        r={6}
        onPointerDown={startDrag(2)}
      />
    </svg>
  )
}
