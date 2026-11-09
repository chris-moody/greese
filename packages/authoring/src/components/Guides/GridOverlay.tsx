'use client'
import { useEffect, useRef, useState, type JSX } from 'react'

/** Below this on-screen spacing the grid would be a wall of lines: it isn't drawn. */
const MIN_SPACING = 4

export interface GridOverlayProps {
  /** The stage origin's offset from the container's center, horizontally: the rulers' `offsetX`. */
  offsetX: number
  /** The stage origin's offset from the container's center, vertically: the rulers' `offsetY`. */
  offsetY: number
  /** The zoom: screen pixels per stage unit, 1 for 100%. */
  scale: number
  /** The spacing between lines, in stage units. */
  interval: number
}

/**
 * A reference grid over the stage, a line every `interval` stage units from
 * the origin, laid out as the rulers and guides are. It fills its positioned
 * container, takes no pointer input, and draws nothing while its lines would
 * be closer than 4 pixels. Its colour is `--greese-grid-color`.
 *
 * ```tsx
 * {showGrid && <GridOverlay offsetX={pan.x} offsetY={pan.y} scale={zoom} interval={10} />}
 * ```
 */
export const GridOverlay = ({
  offsetX,
  offsetY,
  scale,
  interval,
}: GridOverlayProps): JSX.Element => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  // The svg always mounts: it's how the container gets measured at all.
  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    measure()
    return () => observer.disconnect()
  }, [])

  const step = interval * scale
  let d = ''
  if (size.w > 0 && size.h > 0 && interval > 0 && step >= MIN_SPACING) {
    const cx = size.w / 2 + offsetX
    const cy = size.h / 2 + offsetY
    // Half-pixel lines, so a 1px stroke is crisp.
    const crisp = (n: number) => Math.round(n) + 0.5
    for (let i = Math.ceil(-cx / step); cx + i * step <= size.w; i++)
      d += `M${crisp(cx + i * step)} 0V${size.h}`
    for (let i = Math.ceil(-cy / step); cy + i * step <= size.h; i++)
      d += `M0 ${crisp(cy + i * step)}H${size.w}`
  }

  return (
    // eslint-disable-next-line no-restricted-syntax -- a drawing of the stage's grid, not an icon
    <svg ref={svgRef} className="greese-GridOverlay" aria-hidden="true">
      {d && <path className="greese-GridOverlay-lines" d={d} />}
    </svg>
  )
}
