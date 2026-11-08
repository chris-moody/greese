'use client'
import {
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { cx, useTokenColors } from '@greese/react'
import { beginPointerDrag } from '../../core/pointerDrag.ts'

/** Stage units between a ruler's ticks: every minor one is drawn, every major one labelled. */
export interface RulerTicks {
  minor: number
  major: number
}

const FIXED_TICKS: RulerTicks = { minor: 25, major: 100 }

/**
 * Tick spacing that suits a zoom: labels at least 40px apart on a 1, 2, 5
 * step, and minor ticks dividing them in fives (or tens, twos) at least 6px
 * apart. A 24-unit icon at 1600% gets a label every 5 units and a tick per
 * unit; a 1000px scene at 100% a label every 50 and a tick every 10.
 */
export const rulerTicks = (scale: number): RulerTicks => {
  const power = 10 ** Math.floor(Math.log10(40 / scale))
  const major =
    [1, 2, 5, 10].map((n) => n * power).find((m) => m * scale >= 40) ?? 10 * power
  const parts = [5, 10, 2].find((n) => (major / n) * scale >= 6) ?? 1
  return { minor: major / parts, major }
}

/** A label without float noise: 0.30000000000000004 is 0.3. */
const label = (n: number) => String(Number(n.toFixed(6)))

/**
 * Thickness of each ruler strip, in CSS pixels. It is both the canvas's
 * drawing-buffer size and its CSS box, so it is handed to the stylesheet as
 * `--ruler-size` rather than written down twice.
 */
export const RULER_SIZE = 18

export interface StageRulersProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Canvas-pixel pan offset of stage origin (horizontal). Default 0. */
  offsetX?: number
  /** Canvas-pixel pan offset of stage origin (vertical). Default 0. */
  offsetY?: number
  /** Viewport zoom scale. Default 1. */
  scale?: number
  /**
   * Called on every pointermove while dragging from a ruler (live preview).
   * Same semantics as {@link onCreateGuide}.
   */
  onPreviewGuide?: (type: 'horizontal' | 'vertical', position: number) => void
  /**
   * Called when the user releases after dragging from a ruler to commit the guide.
   * Drag from the horizontal ruler → type='horizontal' (fixed Y).
   * Drag from the vertical ruler → type='vertical' (fixed X).
   * `position` is in stage-space units at the pointer release point.
   */
  onCreateGuide?: (type: 'horizontal' | 'vertical', position: number) => void
  /** Called when a ruler drag is cancelled before release. */
  onCancelGuide?: () => void
  /**
   * The ticks' spacing in stage units, or `'auto'` to suit the zoom
   * (`rulerTicks`): for a drawing measured in a few units, like an icon.
   * @default { minor: 25, major: 100 }
   */
  ticks?: RulerTicks | 'auto'
}

function drawHorizontal(
  ticks: RulerTicks,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  originPx: number,
  scale: number,
  fg: string,
  bg: string,
  divider: string
) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = divider
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, h - 0.5)
  ctx.lineTo(w, h - 0.5)
  ctx.stroke()

  ctx.fillStyle = fg
  ctx.font = '9px system-ui, sans-serif'
  ctx.textBaseline = 'top'

  // Every visible multiple of the minor spacing
  const stepPx = ticks.minor * scale
  if (stepPx < 1) return // too dense to draw meaningfully

  const kMin = Math.floor(-originPx / stepPx)
  const kMax = Math.ceil((w - originPx) / stepPx)

  ctx.strokeStyle = fg
  ctx.lineWidth = 1

  for (let k = kMin; k <= kMax; k++) {
    const cx = originPx + k * stepPx
    if (cx < 0 || cx > w) continue
    const stageX = k * ticks.minor
    const isMajor = k % Math.round(ticks.major / ticks.minor) === 0
    const tickH = isMajor ? 10 : 5
    ctx.beginPath()
    ctx.moveTo(cx + 0.5, h - tickH)
    ctx.lineTo(cx + 0.5, h)
    ctx.stroke()
    if (isMajor) ctx.fillText(label(stageX), cx + 3, 1)
  }
}

function drawVertical(
  ticks: RulerTicks,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  originPy: number,
  scale: number,
  fg: string,
  bg: string,
  divider: string
) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = divider
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(w - 0.5, 0)
  ctx.lineTo(w - 0.5, h)
  ctx.stroke()

  ctx.fillStyle = fg
  ctx.font = '9px system-ui, sans-serif'
  ctx.textBaseline = 'middle'

  const stepPx = ticks.minor * scale
  if (stepPx < 1) return

  const kMin = Math.floor(-originPy / stepPx)
  const kMax = Math.ceil((h - originPy) / stepPx)

  ctx.strokeStyle = fg
  ctx.lineWidth = 1

  for (let k = kMin; k <= kMax; k++) {
    const cy = originPy + k * stepPx
    if (cy < 0 || cy > h) continue
    const stageY = k * ticks.minor
    const isMajor = k % Math.round(ticks.major / ticks.minor) === 0
    const tickLen = isMajor ? 10 : 5
    ctx.beginPath()
    ctx.moveTo(w - tickLen, cy + 0.5)
    ctx.lineTo(w, cy + 0.5)
    ctx.stroke()
    if (isMajor) {
      ctx.save()
      ctx.translate(w / 2 - 1, cy - 1)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(label(stageY), 2, 0)
      ctx.restore()
    }
  }
}

/**
 * Rulers along the stage's top and left edges, in stage units, following its
 * pan and zoom. Drag from one onto the stage to make a guide: from the top
 * ruler a horizontal one, from the left a vertical one. Drawn on canvases in
 * the theme's colors.
 *
 * ```tsx
 * <StageRulers offsetX={pan.x} offsetY={pan.y} scale={zoom} onCreateGuide={addGuide} />
 * ```
 */
export const StageRulers = ({
  offsetX = 0,
  offsetY = 0,
  scale = 1,
  onPreviewGuide,
  onCreateGuide,
  onCancelGuide,
  ticks: tickOption = FIXED_TICKS,
  className,
  style,
  ...props
}: StageRulersProps): JSX.Element => {
  const ticks = tickOption === 'auto' ? rulerTicks(scale) : tickOption
  const { minor, major } = ticks
  const wrapperRef = useRef<HTMLDivElement>(null)
  const hRef = useRef<HTMLCanvasElement>(null)
  const vRef = useRef<HTMLCanvasElement>(null)
  // Keep latest props accessible inside pointer handlers without re-registering.
  const propsRef = useRef({
    offsetX,
    offsetY,
    scale,
    onPreviewGuide,
    onCreateGuide,
    onCancelGuide,
  })
  propsRef.current = {
    offsetX,
    offsetY,
    scale,
    onPreviewGuide,
    onCreateGuide,
    onCancelGuide,
  }

  // A canvas has no CSS, so the tick/label colors have to be resolved to real
  // strings rather than left as `var()`s. See `useTokenColors`.
  const [fg, bg, divider] = useTokenColors(wrapperRef, 'fg-muted', 'surface', 'border')

  useEffect(() => {
    const h = hRef.current
    const v = vRef.current
    if (!h || !v) return

    const draw = () => {
      // Each ruler canvas's own CSS box is the full stage-area size *minus*
      // the reserved RULER_SIZE corner (see _StageRulers.scss), offset by
      // RULER_SIZE from the container's left/top edge. The canvas's internal
      // drawing-buffer resolution must match that rendered box exactly —
      // sizing it to the full (unreduced) container instead makes the
      // browser scale+shift the drawing to fit the narrower box, which is
      // what desynced ruler ticks from GuidesOverlay/NeoPixelsGridOverlay
      // (both sized 1:1 to the same full container). The origin is computed
      // against the full container, then shifted left/up by RULER_SIZE to
      // land in the canvas's own local coordinate space.
      const fullW = h.parentElement?.clientWidth ?? 200
      const hw = Math.max(0, fullW - RULER_SIZE)
      h.width = hw
      h.height = RULER_SIZE
      const hCtx = h.getContext('2d')
      if (hCtx)
        drawHorizontal(
          { minor, major },
          hCtx,
          hw,
          RULER_SIZE,
          fullW / 2 + offsetX - RULER_SIZE,
          scale,
          fg,
          bg,
          divider
        )

      const fullH = v.parentElement?.clientHeight ?? 200
      const vh = Math.max(0, fullH - RULER_SIZE)
      v.width = RULER_SIZE
      v.height = vh
      const vCtx = v.getContext('2d')
      if (vCtx)
        drawVertical(
          { minor, major },
          vCtx,
          RULER_SIZE,
          vh,
          fullH / 2 + offsetY - RULER_SIZE,
          scale,
          fg,
          bg,
          divider
        )
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(h.parentElement!)
    return () => ro.disconnect()
  }, [offsetX, offsetY, scale, fg, bg, divider, minor, major])

  // Drag-from-ruler → create guide.
  // Horizontal ruler (top)  → horizontal guide (fixed Y line): drag down to set Y.
  // Vertical ruler   (left) → vertical guide (fixed X line):   drag right to set X.
  const makeRulerDragHandler = useCallback(
    (rulerType: 'horizontal' | 'vertical') =>
      (e: ReactPointerEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget

        /**
         * Map the current pointer position to a { axis, position } pair.
         *
         * Both ruler canvases are positioned inside the same container as the
         * stage canvas (RulersWrapper with inset:0). The parent element's
         * clientWidth/clientHeight gives the stage-area dimensions in CSS px.
         *
         * Horizontal ruler (top bar, full-width, RULER_SIZE tall):
         *   canvas.width = stageAreaWidth, canvas.height = RULER_SIZE.
         *   Dragging down → Y position → horizontal guide.
         *   Stage-area height = canvas.parentElement.clientHeight.
         *
         * Vertical ruler (left bar, RULER_SIZE wide, full-height):
         *   canvas.width = RULER_SIZE, canvas.height = stageAreaHeight.
         *   Dragging right → X position → vertical guide.
         *   Stage-area width = canvas.parentElement.clientWidth.
         */
        const resolvePosition = (evt: PointerEvent): { axis: 'h' | 'v'; pos: number } => {
          const { offsetX: panX, offsetY: panY, scale: z } = propsRef.current
          const rect = canvas.getBoundingClientRect()
          const parent = canvas.parentElement
          if (rulerType === 'horizontal') {
            // Top ruler: use Y coordinate → horizontal guide (fixed Y).
            const stageH = parent?.clientHeight ?? canvas.width
            const originY = stageH / 2 + panY
            const canvasY = evt.clientY - rect.top
            return { axis: 'h', pos: (canvasY - originY) / z }
          } else {
            // Left ruler: use X coordinate → vertical guide (fixed X).
            const stageW = parent?.clientWidth ?? canvas.height
            const originX = stageW / 2 + panX
            const canvasX = evt.clientX - rect.left
            return { axis: 'v', pos: (canvasX - originX) / z }
          }
        }

        beginPointerDrag(e, {
          captureTarget: canvas,
          onMove: (evt) => {
            const { onPreviewGuide: preview } = propsRef.current
            if (!preview) return
            const { axis, pos } = resolvePosition(evt)
            preview(axis === 'h' ? 'horizontal' : 'vertical', pos)
          },
          onEnd: (evt) => {
            if (evt.type === 'pointercancel') {
              propsRef.current.onCancelGuide?.()
              return
            }
            const { onCreateGuide: cb } = propsRef.current
            if (!cb) return
            const { axis, pos } = resolvePosition(evt)
            cb(axis === 'h' ? 'horizontal' : 'vertical', pos)
          },
        })
      },
    []
  )

  return (
    // The rulers are drawn (canvas) and decorative to assistive tech: the
    // guides they create are reachable from the guides panel.
    <div
      {...props}
      ref={wrapperRef}
      className={cx('greese-StageRulers', className)}
      aria-hidden="true"
      style={{ '--greese-ruler-size': `${RULER_SIZE}px`, ...style } as CSSProperties}
    >
      <div className="greese-StageRulers-corner" />
      <canvas
        ref={hRef}
        className="greese-StageRulers-ruler"
        data-ruler="h"
        onPointerDown={makeRulerDragHandler('horizontal')}
      />
      <canvas
        ref={vRef}
        className="greese-StageRulers-ruler"
        data-ruler="v"
        onPointerDown={makeRulerDragHandler('vertical')}
      />
    </div>
  )
}
