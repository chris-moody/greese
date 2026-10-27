/* eslint-disable no-restricted-syntax -- Not an icon: the wordmark, a gradient over the logo's letters. */
import { useId, type JSX } from 'react'
import { LETTERS, STROKE, SWOOSH, WORDMARK_BOX } from './glyphs.ts'

/**
 * The wordmark as the logo's letters under its swoosh, in the theme's colors (site.scss),
 * which follow the theme and the color scheme as they change. favicon.ts
 * reads its colors back for the tab's icon.
 */
export const WordmarkGlyphs = (): JSX.Element => {
  const id = useId()
  const stroke = {
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const
  return (
    <svg
      className="site-wordmark-glyphs"
      viewBox={WORDMARK_BOX}
      role="img"
      aria-label="greese"
    >
      <defs>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1="60"
          y1="300"
          x2="800"
          y2="200"
        >
          <stop offset="0" className="site-logo-stop-1" />
          <stop offset="0.38" className="site-logo-stop-2" />
          <stop offset="0.72" className="site-logo-stop-3" />
          <stop offset="1" className="site-logo-stop-4" />
        </linearGradient>
      </defs>
      {/* The swoosh behind the letters, on a rim of its own: the fill dropped
          and outlined, like the letters' strokes. */}
      <path
        d={SWOOSH}
        fillRule="evenodd"
        className="site-logo-rim site-logo-rim--fill"
        strokeWidth={8}
        strokeLinejoin="round"
        transform="translate(2 5)"
      />
      <path d={SWOOSH} fillRule="evenodd" fill={`url(#${id})`} />
      <g
        {...stroke}
        className="site-logo-rim"
        strokeWidth={STROKE + 8}
        transform="translate(2 5)"
      >
        {LETTERS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g {...stroke} stroke={`url(#${id})`} strokeWidth={STROKE}>
        {LETTERS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}
