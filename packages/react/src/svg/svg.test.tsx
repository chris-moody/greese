import { act, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../test/axe.ts'
import { fakeFrames, restoreFrames } from '../test/frames.ts'
import { setMedia } from '../test/matchMedia.ts'
import {
  Distort,
  FeBlend,
  FeColorMatrix,
  FeComposite,
  FeDisplacementMap,
  FeDropShadow,
  FeFlood,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  FeMorphology,
  FeOffset,
  FeTurbulence,
  Glow,
  Goo,
  Grain,
  ClipPath,
  Drawing,
  DrawPath,
  Filter,
  LinearGradient,
  MarqueePath,
  Mask,
  Morph,
  Path,
  RadialGradient,
  toPath,
  url,
} from './index.ts'

const star = { type: 'star', cx: 50, cy: 50, r: 40 } as const
const circle = { type: 'circle', cx: 50, cy: 50, r: 40 } as const

interface Call {
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
  animation: {
    cancel: () => void
    pause: () => void
    play: () => void
    playState: string
  }
}
let calls: Call[] = []

beforeEach(() => {
  calls = []
  // jsdom has no Web Animations: record what would play.
  Element.prototype.animate = function (keyframes, options) {
    const animation = {
      playState: 'running',
      effect: { getComputedTiming: () => ({ progress: 0.5 }) },
      cancel: vi.fn(),
      pause: vi.fn(function (this: { playState: string }) {
        this.playState = 'paused'
      }),
      play: vi.fn(),
      onfinish: null,
    }
    calls.push({
      keyframes: keyframes as Keyframe[],
      options: options as KeyframeAnimationOptions,
      animation,
    })
    return animation as unknown as Animation
  }
})

afterEach(() => {
  setMedia({ reducedMotion: false })
  restoreFrames()
})

describe('Drawing', () => {
  it('is a named image with a label, and hidden without one', async () => {
    const { container, rerender } = render(
      <Drawing viewBox="0 0 100 100" label="A star">
        <Path d={star} />
      </Drawing>
    )
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('role', 'img')
    expect(svg).toHaveAccessibleName('A star')
    await expectNoAxeViolations(container)
    rerender(<Drawing viewBox="0 0 100 100" />)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('role')
  })
})

describe('filter primitives', () => {
  it('take friendly names and write the native attributes', () => {
    const { container } = render(
      <svg>
        <Filter id="f" colorInterpolation="sRGB">
          <FeFlood color="gold" opacity={0.5} result="tint" />
          <FeGaussianBlur in="SourceAlpha" deviation={[4, 0]} edges="none" />
          <FeOffset x={2} y={3} result="moved" />
          <FeDropShadow x={1} y={4} blur={3} color="black" opacity={0.4} />
          <FeComposite in="tint" in2="SourceAlpha" operator="in" />
          <FeBlend in2="moved" mode="multiply" />
          <FeColorMatrix type="saturate" values={0} />
          <FeTurbulence frequency={0.8} octaves={3} stitch type="fractalNoise" />
          <FeDisplacementMap in2="noise" scale={8} xChannel="R" yChannel="G" />
          <FeMorphology operator="dilate" radius={2} />
          <FeMerge result="stack">
            <FeMergeNode in="moved" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </svg>
    )
    const attrs = (tag: string) =>
      Object.fromEntries(
        [...container.querySelector(`#f ${tag}`)!.attributes].map((a) => [
          a.name,
          a.value,
        ])
      )
    expect(
      container.querySelector('#f')!.getAttribute('color-interpolation-filters')
    ).toBe('sRGB')
    expect(attrs('feFlood')).toEqual({
      'flood-color': 'gold',
      'flood-opacity': '0.5',
      result: 'tint',
    })
    expect(attrs('feGaussianBlur')).toEqual({
      in: 'SourceAlpha',
      stdDeviation: '4 0',
      edgeMode: 'none',
    })
    expect(attrs('feOffset')).toEqual({ dx: '2', dy: '3', result: 'moved' })
    expect(attrs('feDropShadow')).toMatchObject({
      dx: '1',
      dy: '4',
      stdDeviation: '3',
      'flood-color': 'black',
      'flood-opacity': '0.4',
    })
    expect(attrs('feBlend')).toEqual({ in2: 'moved', mode: 'multiply' })
    expect(attrs('feColorMatrix')).toEqual({ type: 'saturate', values: '0' })
    expect(attrs('feTurbulence')).toEqual({
      type: 'fractalNoise',
      baseFrequency: '0.8',
      numOctaves: '3',
      stitchTiles: 'stitch',
    })
    expect(attrs('feDisplacementMap')).toEqual({
      in2: 'noise',
      scale: '8',
      xChannelSelector: 'R',
      yChannelSelector: 'G',
    })
    expect(attrs('feMorphology')).toEqual({ operator: 'dilate', radius: '2' })
    expect(
      [...container.querySelectorAll('#f feMergeNode')].map((n) => n.getAttribute('in'))
    ).toEqual(['moved', 'SourceGraphic'])
  })

  it('presets render their primitives in place', () => {
    const { container } = render(
      <svg>
        <Filter id="p">
          <Goo blur={6} />
          <Grain seed={4} />
          <Distort scale={6} />
        </Filter>
      </svg>
    )
    const tags = [...container.querySelector('#p')!.children].map((c) => c.localName)
    expect(tags).toEqual([
      'feGaussianBlur',
      'feColorMatrix',
      'feComposite',
      'feTurbulence',
      'feColorMatrix',
      'feComposite',
      'feComposite',
      'feTurbulence',
      'feDisplacementMap',
    ])
  })
})

describe('Path', () => {
  it('draws shape specs and path data, and slices on the server', () => {
    const html = renderToString(
      <svg>
        <Path d={circle} slice={{ start: 10, end: 30 }} />
        <Path d="M0 0H10" />
      </svg>
    )
    expect(html).toContain(`d="${toPath(circle)}"`)
    expect(html).toContain('pathLength="100"')
    expect(html).toContain('stroke-dasharray:20 101;stroke-dashoffset:-10')
    expect(html).toContain('d="M0 0H10"')
  })

  it('lets your own style win', () => {
    const { container } = render(
      <svg>
        <Path d="M0 0H10" slice={{ end: 50 }} style={{ strokeDashoffset: 3 }} />
      </svg>
    )
    const path = container.querySelector('path')!
    expect(path.style.strokeDasharray).toBe('50 101')
    expect(path.style.strokeDashoffset).toBe('3')
  })
})

describe('DrawPath', () => {
  it('renders at its target and plays from its start', () => {
    const { container } = render(
      <svg>
        <DrawPath d={star} duration={1} delay={0.5} />
      </svg>
    )
    expect(container.querySelector('path')!.style.strokeDasharray).toBe('100 101')
    expect(calls).toHaveLength(1)
    expect(calls[0]!.keyframes[0]).toEqual({
      strokeDasharray: '0 101',
      strokeDashoffset: '0.001',
    })
    expect(calls[0]!.options).toMatchObject({
      duration: 1000,
      delay: 500,
      fill: 'backwards',
    })
  })

  it('holds still inside an app-reduced subtree', () => {
    render(
      <svg data-greese-motion="reduce">
        <DrawPath d={star} />
      </svg>
    )
    expect(calls).toHaveLength(0)
  })

  it('repeats forever with repeat -1', () => {
    render(
      <svg>
        <DrawPath d={star} repeat={-1} />
      </svg>
    )
    expect(calls[0]!.options).toMatchObject({ iterations: Infinity })
  })

  it('carries on from where it is when the target changes', () => {
    const { rerender } = render(
      <svg>
        <DrawPath d={star} to={{ end: 100 }} />
      </svg>
    )
    rerender(
      <svg>
        <DrawPath d={star} to={{ end: 100 }} />
      </svg>
    )
    // The same slice in a new object doesn't restart it.
    expect(calls).toHaveLength(1)
    rerender(
      <svg>
        <DrawPath d={star} to={{ start: 100, end: 100 }} />
      </svg>
    )
    expect(calls[0]!.animation.cancel).toHaveBeenCalled()
    // Halfway through the first play: half drawn.
    expect(calls[1]!.keyframes[0]).toEqual({
      strokeDasharray: '50 101',
      strokeDashoffset: '0',
    })
  })

  it('pauses, and shows its target at once under reduced motion', () => {
    const { rerender } = render(
      <svg>
        <DrawPath d={star} />
      </svg>
    )
    rerender(
      <svg>
        <DrawPath d={star} paused />
      </svg>
    )
    expect(calls[0]!.animation.pause).toHaveBeenCalled()
    calls = []
    setMedia({ reducedMotion: true })
    render(
      <svg>
        <DrawPath d={star} />
      </svg>
    )
    expect(calls).toHaveLength(0)
  })
})

describe('MarqueePath', () => {
  it('tiles the path with its dashes and runs one lap per loop', () => {
    const { container } = render(
      <svg>
        <MarqueePath d={circle} count={4} size={5} duration={3} />
      </svg>
    )
    const path = container.querySelector('path')!
    expect(path.getAttribute('pathLength')).toBe('100')
    expect(path.style.strokeDasharray).toBe('5 20')
    expect(calls[0]!.keyframes).toEqual([
      { strokeDashoffset: '0' },
      { strokeDashoffset: '-25' },
    ])
    expect(calls[0]!.options).toMatchObject({ duration: 3000, iterations: Infinity })
  })
})

describe('Morph', () => {
  beforeEach(fakeFrames)

  it('renders the shape at `index`, and morphs to a new one', () => {
    const done = vi.fn()
    const { container, rerender } = render(
      <svg>
        <Morph shapes={[star, circle]} index={0} duration={1} onFinish={done} />
      </svg>
    )
    const path = container.querySelector('path')!
    expect(path.getAttribute('d')).toBe(toPath(star))
    rerender(
      <svg>
        <Morph shapes={[star, circle]} index={1} duration={1} onFinish={done} />
      </svg>
    )
    // Still the star (matched to the circle's structure), not the circle yet.
    expect(path.getAttribute('d')).not.toBe(toPath(circle))
    expect(path.getAttribute('d')).toMatch(/^M[\d.\s-]+C/)
    act(() => vi.advanceTimersByTime(1200))
    expect(path.getAttribute('d')).toBe(toPath(circle))
    expect(done).toHaveBeenCalledOnce()
  })

  it('morphs in from `from` when it mounts', () => {
    const { container } = render(
      <svg>
        <Morph shapes={[star, circle]} from={0} index={1} duration={1} />
      </svg>
    )
    const path = container.querySelector('path')!
    expect(path.getAttribute('d')).not.toBe(toPath(circle))
    act(() => vi.advanceTimersByTime(1200))
    expect(path.getAttribute('d')).toBe(toPath(circle))
  })

  it('follows `progress` with no animation, on the server too', () => {
    const html = renderToString(
      <svg>
        <Morph shapes={['M0 0H10', 'M0 0H20']} progress={0.5} />
      </svg>
    )
    expect(html).toContain('d="M0 0C5 0 10 0 15 0"')
  })
})

describe('definitions', () => {
  it('render gradients, filters, clip paths and masks with React’s prop names', () => {
    const { container } = render(
      <svg>
        <defs>
          <LinearGradient
            id="sky"
            angle={90}
            stops={['red', { color: 'blue', opacity: 0.5 }]}
          />
          <RadialGradient id="sun" fx="30%" stops={['white', 'gold']} />
          <Filter id="glow" x="-50%">
            <Glow color="gold" />
            <feOffset dx={1} />
          </Filter>
          <ClipPath id="hex" content={[{ type: 'regularPolygon', r: 10 }]} />
          <Mask id="fade" content={['M0 0H10V10H0Z']} type="alpha" />
        </defs>
        <rect fill={url('sky')} width={10} height={10} />
      </svg>
    )
    const stop = container.querySelector('#sky stop:last-child')!
    expect(stop.getAttribute('stop-color')).toBe('blue')
    expect(stop.getAttribute('stop-opacity')).toBe('0.5')
    expect(container.querySelector('#sky')!.getAttribute('x2')).toBe('1')
    expect(container.querySelector('#sun')!.getAttribute('fx')).toBe('30%')
    expect(container.querySelector('#glow feFlood')!.getAttribute('flood-color')).toBe(
      'gold'
    )
    expect(container.querySelector('#glow > :last-child')!.localName).toBe('feOffset')
    expect(container.querySelector('#hex path')!.getAttribute('d')).toMatch(/^M0 -10L/)
    expect(container.querySelector('#fade')!.getAttribute('mask-type')).toBe('alpha')
    expect(container.querySelector('#fade path')!.getAttribute('fill')).toBe('white')
  })
})
