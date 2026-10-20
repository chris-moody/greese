import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import * as icons from './index.ts'
import { createIcon, SearchIcon } from './index.ts'

afterEach(cleanup)

describe('icons', () => {
  it('are decorative by default, sized to the text and drawn in currentColor', () => {
    const { container } = render(<SearchIcon />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('width')).toBe('1em')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
    expect(svg.getAttribute('focusable')).toBe('false')
    expect(svg.querySelectorAll('path')).toHaveLength(2)
  })

  it('sit inline in text by default, and take your style', () => {
    const { container } = render(<SearchIcon style={{ verticalAlign: 'middle' }} />)
    const svg = container.querySelector('svg')!
    expect(svg.style.display).toBe('inline-block')
    expect(svg.style.verticalAlign).toBe('middle')
  })

  it('become a named image with a title', () => {
    render(<SearchIcon title="Search" />)
    expect(screen.getByRole('img', { name: 'Search' }).tagName).toBe('svg')
  })

  it('take size, stroke width and any SVG prop', () => {
    const { container } = render(
      <SearchIcon size={24} strokeWidth={2} className="x" fill="currentColor" />
    )
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('24')
    expect(svg.getAttribute('stroke-width')).toBe('2')
    expect(svg.getAttribute('class')).toBe('x')
    expect(svg.getAttribute('fill')).toBe('currentColor')
  })

  it('have readable names, for devtools', () => {
    expect(createIcon('Kite', 'M0 0').displayName).toBe('KiteIcon')
    for (const [name, value] of Object.entries(icons))
      if (/^[A-Z]\w*Icon$/.test(name))
        expect((value as { displayName: string }).displayName).toBe(name)
  })
})
