import type { JSX, ReactNode } from 'react'
import type { Decorator } from '@storybook/react-vite'
import { Drawing, Filter, Path, url } from '@greese/react/svg'

/** The star a filter story applies its filter to, unless it brings its own art. */
const star = (
  <Path
    d={{ type: 'star', cx: 60, cy: 62, r: 40, innerRadius: 18 }}
    style={{ fill: 'var(--greese-color-primary)' }}
  />
)

/**
 * A decorator for a filter primitive's or preset's story: the story inside a
 * `<Filter id>` with room to paint past the shape, applied to a star (or
 * `parameters.art`).
 */
export const filterStage = (id: string): Decorator => {
  const FilterStage: Decorator = (Story, { parameters }): JSX.Element => (
    <Drawing viewBox="0 0 120 120" width={200} height={200}>
      <defs>
        <Filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <Story />
        </Filter>
      </defs>
      <g filter={url(id)}>{(parameters.art as ReactNode) ?? star}</g>
    </Drawing>
  )
  return FilterStage
}

/** Three circles near each other, for the goo effect. */
export const blobs = (
  <g style={{ fill: 'var(--greese-color-secondary)' }}>
    <circle cx={38} cy={60} r={22} />
    <circle cx={76} cy={60} r={16} />
    <circle cx={100} cy={54} r={8} />
  </g>
)
