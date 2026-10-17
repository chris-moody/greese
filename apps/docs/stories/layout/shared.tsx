import type { CSSProperties, ReactNode } from 'react'

const tile: CSSProperties = {
  padding: 'var(--sauce-space-3) var(--sauce-space-4)',
  background: 'var(--sauce-color-surface)',
  border: '1px solid var(--sauce-color-border)',
  borderRadius: 'var(--sauce-radius-md)',
  color: 'var(--sauce-color-fg)',
}

/** A visible placeholder child for layout stories. */
export const Tile = ({
  children,
  style,
}: {
  children?: ReactNode
  style?: CSSProperties
}) => <div style={{ ...tile, ...style }}>{children}</div>
