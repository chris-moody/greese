/* eslint-disable no-restricted-syntax -- Not icons: the footer's logo artwork, its gradients and filters. */
import { useEffect, useId, useRef, type JSX } from 'react'
import { useGreese } from '@greese/react'
import type { Timeline } from '@greese/js'
import { useShell } from '../shell.ts'
import { LETTERS, STROKE } from './glyphs.ts'
import { buildLogoLoop, logoMotion } from './motion.ts'
import { HEXAGONS, PARTICLES, SPARKLES, SWOOSH, sparkle } from './scene.ts'

const BOX = '0 0 860 440'

const letters = (props: JSX.IntrinsicElements['g']) => (
  <g
    fill="none"
    strokeWidth={STROKE}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {LETTERS.map((d) => (
      <path key={d} d={d} />
    ))}
  </g>
)

/** A flood of one of the logo's colors (site.scss), kept where `mask` is opaque. */
const glow = (className: string, mask: string, result?: string) => (
  <>
    <feFlood className={className} />
    <feComposite in2={mask} operator="in" result={result} />
  </>
)

/**
 * The logo under the footer (docs/plans/logo/greese_final.svg) in the theme's
 * colors, looping in its motion: sparkles and particles leave and come back
 * the way the theme's entrances arrive, while the letters' and swoosh's
 * gradients flow (logo/motion.ts).
 *
 * Three stacked SVGs, so the costly filters don't run every frame: the glow
 * and edge underneath and the shading and gloss on top only read the
 * letters' shapes, so they're drawn once on layers of their own; between
 * them the animated layer has the fills, the dark rims (plain strokes
 * instead of filters) and the particles and sparkles. The loop runs only
 * while the logo is on screen.
 */
export const FooterLogo = (): JSX.Element => {
  const id = useId()
  const ref = (name: string) => `${id}${name}`
  const url = (name: string) => `url(#${ref(name)})`
  const root = useRef<HTMLDivElement>(null)
  const loop = useRef<Timeline>(undefined)
  const inView = useRef(false)
  const { spec } = useShell()
  const motion = spec.motionDefaults
  const { kind } = logoMotion(motion)

  useGreese(
    (g) => {
      const el = root.current
      if (!el) return
      const style = getComputedStyle(el)
      const m = logoMotion(motion, (token) =>
        style.getPropertyValue(`--greese-easing-${token}`)
      )
      const tl = buildLogoLoop(
        g.timeline({ repeat: -1, paused: true }),
        {
          particles: g.select('.site-logo-particles > *'),
          sparkles: g.select('.site-logo-sparkles > *'),
          gradients: [
            [el.querySelector(`#${ref('letters')}`)!, 'translate(600 300)'],
            [el.querySelector(`#${ref('swoosh')}`)!, 'translate(600 -300)'],
          ],
        },
        m
      )
      loop.current = tl
      if (inView.current) tl.play()
      return () => {
        loop.current = undefined
      }
    },
    { scope: root, dependencies: [JSON.stringify(motion ?? null)], revertOnUpdate: true }
  )

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      inView.current = !!entry?.isIntersecting
      if (inView.current) loop.current?.play()
      else loop.current?.pause()
    })
    observer.observe(root.current!)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={root} className="site-logo" data-motion={kind} aria-hidden="true">
      <svg className="site-logo-layer site-logo-still" viewBox={BOX}>
        <defs>
          <filter
            id={ref('halo')}
            x="-10%"
            y="-30%"
            width="120%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="16" result="blur" />
            {glow('site-logo-glow', 'blur', 'halo')}
            {/* A thin bright band just outside the rims (drawn on the live layer). */}
            <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="wide" />
            <feOffset in="wide" dx="2" dy="5" result="dropped" />
            <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="tight" />
            <feMerge result="rim">
              <feMergeNode in="dropped" />
              <feMergeNode in="tight" />
            </feMerge>
            <feMorphology in="rim" operator="dilate" radius="1.5" result="outer" />
            <feComposite in="outer" in2="rim" operator="out" result="band" />
            <feGaussianBlur in="band" stdDeviation="1.2" result="soft" />
            {glow('site-logo-edge', 'soft', 'edge')}
            <feMerge>
              <feMergeNode in="halo" />
              <feMergeNode in="edge" />
            </feMerge>
          </filter>
          <filter id={ref('swoosh-halo')} x="-15%" y="-30%" width="130%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="blur" />
            {glow('site-logo-glow site-logo-glow--soft', 'blur')}
          </filter>
        </defs>
        <g className="site-logo-hexagons">
          {HEXAGONS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <path d={SWOOSH} filter={url('swoosh-halo')} />
        {letters({ stroke: 'black', filter: url('halo') })}
      </svg>

      <svg className="site-logo-layer" viewBox={BOX}>
        <defs>
          {/* Reflected, so flowing two lengths along (motion.ts) loops seamlessly. */}
          <linearGradient
            id={ref('letters')}
            gradientUnits="userSpaceOnUse"
            spreadMethod="reflect"
            x1="400"
            y1="50"
            x2="700"
            y2="200"
            gradientTransform="translate(0 0)"
          >
            <stop offset="0" className="site-logo-stop-1" />
            <stop offset="0.38" className="site-logo-stop-2" />
            <stop offset="0.72" className="site-logo-stop-3" />
            <stop offset="1" className="site-logo-stop-4" />
          </linearGradient>
          <linearGradient
            id={ref('swoosh')}
            gradientUnits="userSpaceOnUse"
            spreadMethod="reflect"
            x1="400"
            y1="200"
            x2="700"
            y2="50"
            gradientTransform="translate(0 0)"
          >
            <stop offset="0" className="site-logo-stop-1" />
            <stop offset="0.35" className="site-logo-stop-2" />
            <stop offset="1" className="site-logo-stop-4" />
          </linearGradient>
          <filter id={ref('sparkle')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="site-logo-particles" filter={url('sparkle')}>
          {PARTICLES.map(([cx, cy, r, opacity]) => (
            <circle key={`${cx} ${cy}`} cx={cx} cy={cy} r={r} fillOpacity={opacity} />
          ))}
        </g>
        <path
          className="site-logo-rim site-logo-rim--soft"
          d={SWOOSH}
          strokeWidth="5"
          transform="translate(1 3)"
        />
        <path d={SWOOSH} fill={url('swoosh')} />
        {letters({
          className: 'site-logo-rim',
          strokeWidth: STROKE + 12,
          transform: 'translate(2 5)',
        })}
        {letters({ className: 'site-logo-rim', strokeWidth: STROKE + 8 })}
        {letters({ stroke: url('letters') })}
        <g className="site-logo-sparkles" filter={url('sparkle')}>
          {SPARKLES.map((s) => (
            <path key={s.join()} d={sparkle(s)} />
          ))}
        </g>
      </svg>

      <svg className="site-logo-layer site-logo-still" viewBox={BOX}>
        <defs>
          <filter
            id={ref('gloss')}
            x="-10%"
            y="-30%"
            width="120%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            {/* A deep shade along the lower edges. */}
            <feOffset in="SourceAlpha" dx="2" dy="-7" result="up" />
            <feComposite in="SourceAlpha" in2="up" operator="out" result="lower" />
            <feGaussianBlur in="lower" stdDeviation="3" result="lowerSoft" />
            {glow('site-logo-shade', 'lowerSoft')}
            <feComposite in2="SourceAlpha" operator="in" result="shade" />
            {/* A glassy inner rim. */}
            <feMorphology in="SourceAlpha" operator="erode" radius="2.5" result="inner" />
            <feComposite in="SourceAlpha" in2="inner" operator="out" result="ring" />
            <feGaussianBlur in="ring" stdDeviation="0.6" result="ringSoft" />
            {glow('site-logo-shine', 'ringSoft')}
            <feComposite in2="SourceAlpha" operator="in" result="shine" />
            {/* Gloss along the upper edges. */}
            <feOffset in="SourceAlpha" dx="-3" dy="8" result="down" />
            <feComposite in="SourceAlpha" in2="down" operator="out" result="upper" />
            <feGaussianBlur in="upper" stdDeviation="1.8" result="upperSoft" />
            {glow('site-logo-gloss', 'upperSoft')}
            <feComposite in2="SourceAlpha" operator="in" result="gloss" />
            <feMerge>
              <feMergeNode in="shade" />
              <feMergeNode in="shine" />
              <feMergeNode in="gloss" />
            </feMerge>
          </filter>
          <filter
            id={ref('swoosh-gloss')}
            x="-15%"
            y="-30%"
            width="130%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feOffset in="SourceAlpha" dx="-1" dy="4" result="down" />
            <feComposite in="SourceAlpha" in2="down" operator="out" result="upper" />
            <feGaussianBlur in="upper" stdDeviation="1.4" result="upperSoft" />
            {glow('site-logo-gloss site-logo-gloss--soft', 'upperSoft')}
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
        <path d={SWOOSH} filter={url('swoosh-gloss')} />
        {letters({ stroke: 'black', filter: url('gloss') })}
      </svg>
    </div>
  )
}
