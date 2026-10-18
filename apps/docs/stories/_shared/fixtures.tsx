/** Shared story fixtures: placeholder tiles, tiny icons, sample data. */
import type { CSSProperties, ReactNode } from 'react'

const tile: CSSProperties = {
  padding: 'var(--greese-space-3) var(--greese-space-4)',
  background: 'var(--greese-color-surface)',
  border: '1px solid var(--greese-color-border)',
  borderRadius: 'var(--greese-radius-md)',
  color: 'var(--greese-color-fg)',
}

/** A visible placeholder child for layout stories. */
export const Tile = ({
  children,
  style,
}: {
  children?: ReactNode
  style?: CSSProperties
}) => <div style={{ ...tile, ...style }}>{children}</div>

/** Tiny inline icons. GreeseUI is icon-agnostic: bring any set. */
const Svg = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
)

export const PlusIcon = () => <Svg d="M8 3v10M3 8h10" />
export const ArrowIcon = () => <Svg d="M3 8h10M9 4l4 4-4 4" />
export const TrashIcon = () => (
  <Svg d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" />
)
export const SearchIcon = () => (
  <Svg d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5" />
)
export const InfoIcon = () => (
  <Svg d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM8 7.5V11M8 5h.01" />
)
export const StarIcon = () => (
  <Svg d="M8 2l1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3 4.3 13.3l.8-4.1L2 6.3l4.2-.5z" />
)

/** A small SVG "photo" for media stories (no network needed). */
export const art = (hue: number, ratio = '16 9') =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ratio}"><rect width="100%" height="100%" fill="hsl(${hue} 70% 60%)"/><circle cx="75%" cy="35%" r="15%" fill="hsl(${hue} 80% 85%)"/></svg>`
  )}`

export const countries = [
  'Argentina',
  'Australia',
  'Brasil',
  'Canada',
  "Côte d'Ivoire",
  'Denmark',
  'España',
  'France',
  'Germany',
  'India',
  'Japan',
  'México',
  'New Zealand',
  'Norway',
  'Portugal',
  'South Africa',
  'Sverige',
  'United Kingdom',
  'United States',
]
