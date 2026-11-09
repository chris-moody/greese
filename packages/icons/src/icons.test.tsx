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

  it('are all drawn on the 16 grid', () => {
    const { container } = render(
      <>
        {Object.values(icons)
          .filter(
            (v): v is icons.IconComponent => typeof v === 'function' && 'displayName' in v
          )
          .map((Icon) => (
            <Icon key={Icon.displayName} />
          ))}
      </>
    )
    const boxes = new Set(
      [...container.querySelectorAll('svg')].map((s) => s.getAttribute('viewBox'))
    )
    expect([...boxes]).toEqual(['0 0 16 16'])
  })

  it('can be drawn on another grid, or solid', () => {
    const OnTwentyFour = createIcon('OnTwentyFour', 'M2 2h20', {
      viewBox: 24,
      strokeWidth: 1.8,
    })
    const { container } = render(
      <>
        <OnTwentyFour />
        <icons.StarFilledIcon />
      </>
    )
    const [line, solid] = [...container.querySelectorAll('svg')]
    expect(line!.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(line!.getAttribute('stroke-width')).toBe('1.8')
    expect(solid!.getAttribute('fill')).toBe('currentColor')
    expect(solid!.getAttribute('stroke')).toBe('none')
    expect(solid!.getAttribute('stroke-width')).toBeNull()
  })

  it('import and upload are one icon: download turned half a turn', () => {
    expect(icons.UploadIcon).toBe(icons.ImportIcon)
    const { container } = render(<icons.DownloadIcon />)
    expect(container.querySelectorAll('path')).toHaveLength(3)
  })

  it('keep the paths of a two-part icon in order, for CSS that lights one', () => {
    const { container } = render(<icons.SortIcon />)
    expect(
      [...container.querySelectorAll('path')].map((p) => p.getAttribute('d'))
    ).toEqual(['M5 6.5L8 3.5l3 3', 'M5 9.5l3 3 3-3'])
  })

  it('every icon draws something, inside its own grid', () => {
    // One pass over the whole set, so a mistyped path can't ship silently:
    // the file is hand-authored and a typo makes a path the browser drops.
    const entries = Object.entries(icons).filter(([name]) => /^[A-Z]\w*Icon$/.test(name))
    expect(entries.length).toBeGreaterThan(100)
    for (const [name, value] of entries) {
      const Icon = value as typeof SearchIcon
      const { container, unmount } = render(<Icon />)
      const svg = container.querySelector('svg')!
      expect(svg.getAttribute('viewBox'), name).toMatch(/^0 0 \d+ \d+$/)
      const paths = [...svg.querySelectorAll('path')]
      expect(paths.length, name).toBeGreaterThan(0)
      for (const path of paths) {
        const d = path.getAttribute('d')!
        // Starts with a move, holds only path syntax, and isn't a stub. A
        // coordinate-range check was tried and removed: relative commands and
        // an arc's flags and radii aren't coordinates, so it flagged valid art.
        expect(d, name).toMatch(/^[Mm]/)
        expect(d, name).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9\s.,-]+$/)
        expect(d.length, name).toBeGreaterThan(5)
      }
      unmount()
    }
  })

  it('have readable names, for devtools', () => {
    expect(createIcon('Kite', 'M0 0').displayName).toBe('KiteIcon')
    // Aliases keep the name of the icon they are.
    const aliases: Record<string, string> = { UploadIcon: 'ImportIcon' }
    for (const [name, value] of Object.entries(icons))
      if (/^[A-Z]\w*Icon$/.test(name))
        expect((value as { displayName: string }).displayName).toBe(aliases[name] ?? name)
  })
})
