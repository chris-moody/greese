import type { CSSProperties } from 'react'
import { describe, expect, it } from 'vitest'
import {
  isSpaceToken,
  mapResponsive,
  neverToken,
  resolveResponsive,
  responsiveClass,
  responsiveValueClass,
  responsiveVar,
  spaceToCss,
  type ResponsiveConfig,
} from './responsive.ts'

const gap: ResponsiveConfig = {
  block: 'greese-Stack',
  prop: 'gap',
  isToken: isSpaceToken,
  toCss: spaceToCss,
}
const direction: ResponsiveConfig = { block: 'greese-Stack', prop: 'direction' }

describe('naming', () => {
  it('builds class and variable names the SCSS mixin also builds', () => {
    expect(responsiveClass('greese-Stack', 'md', 'gap', 2)).toBe('greese-Stack--md-gap-2')
    expect(responsiveVar('greese-Stack', 'gap', 'md')).toBe('--greese-stack-gap-md')
    expect(responsiveValueClass('greese-Stack', 'md', 'gap')).toBe('greese-Stack--md-gap')
  })
})

describe('isSpaceToken', () => {
  it.each([0, 4, 8])('accepts scale step %d', (v) => expect(isSpaceToken(v)).toBe(true))
  it.each([9, -1, 1.5, '2', '1rem'])('rejects %j', (v) =>
    expect(isSpaceToken(v)).toBe(false)
  )
})

describe('spaceToCss / neverToken', () => {
  it('turns scale tokens into variables and passes lengths through', () => {
    expect(spaceToCss(4)).toBe('var(--greese-space-4)')
    expect(spaceToCss('13px')).toBe('13px')
    expect(neverToken()).toBe(false)
  })
})

describe('mapResponsive', () => {
  const toKey = (full: boolean) => (full ? 'full' : 'auto')

  it('maps a single value or each breakpoint, keeping the shape', () => {
    expect(mapResponsive(true, toKey)).toBe('full')
    expect(mapResponsive({ xs: true, md: false, lg: undefined }, toKey)).toEqual({
      xs: 'full',
      md: 'auto',
    })
  })

  it('passes undefined and null through untouched', () => {
    expect(mapResponsive(undefined, toKey)).toBeUndefined()
    expect(mapResponsive(null as unknown as boolean, (v) => v)).toBeNull()
  })
})

describe('resolveResponsive', () => {
  it('returns the base untouched when there is nothing to resolve', () => {
    const style = { color: 'red' }
    expect(
      resolveResponsive(
        [
          [undefined, gap],
          [null, direction],
        ],
        { className: 'x', style }
      )
    ).toEqual({
      className: 'x',
      style,
    })
    expect(resolveResponsive([])).toEqual({ className: '', style: undefined })
  })

  it('treats a plain value as xs', () => {
    expect(resolveResponsive([[2, gap]])).toEqual({
      className: 'greese-Stack--xs-gap-2',
      style: undefined,
    })
  })

  it('maps token values to classes and others to inline variables, per breakpoint', () => {
    const { className, style } = resolveResponsive(
      [
        [{ xs: 1, md: '2.5rem', lg: 6 }, gap],
        [{ xs: 'column', md: 'row' }, direction],
      ],
      { className: 'greese-Stack' }
    )
    expect(className).toBe(
      'greese-Stack greese-Stack--xs-gap-1 greese-Stack--md-gap greese-Stack--lg-gap-6 ' +
        'greese-Stack--xs-direction-column greese-Stack--md-direction-row'
    )
    expect(style).toEqual({ '--greese-stack-gap-md': '2.5rem' })
  })

  it('emits breakpoints smallest first regardless of key order', () => {
    const { className } = resolveResponsive([
      [{ xl: 'row', xs: 'column', sm: 'row' }, direction],
    ])
    expect(className).toBe(
      'greese-Stack--xs-direction-column greese-Stack--sm-direction-row ' +
        'greese-Stack--xl-direction-row'
    )
  })

  it('skips breakpoints set to undefined or null', () => {
    const { className } = resolveResponsive([
      [{ xs: undefined, md: null as unknown as string, lg: 'row' }, direction],
    ])
    expect(className).toBe('greese-Stack--lg-direction-row')
  })

  it('lets caller style override generated variables', () => {
    const { style } = resolveResponsive([['13px', gap]], {
      style: { '--greese-stack-gap-xs': '1px', color: 'red' } as CSSProperties,
    })
    expect(style).toEqual({ '--greese-stack-gap-xs': '1px', color: 'red' })
  })

  it('treats every value as a token when isToken is omitted', () => {
    const { className, style } = resolveResponsive([
      [7, { block: 'greese-Grid', prop: 'columns' }],
    ])
    expect(className).toBe('greese-Grid--xs-columns-7')
    expect(style).toBeUndefined()
  })

  it('converts inline values with toCss, tokens included when isToken says no', () => {
    const space: ResponsiveConfig = {
      block: 'greese-Box',
      prop: 'p',
      isToken: neverToken,
      toCss: spaceToCss,
    }
    expect(resolveResponsive([[{ xs: 4, md: '2rem' }, space]])).toEqual({
      className: 'greese-Box--xs-p greese-Box--md-p',
      style: {
        '--greese-box-p-xs': 'var(--greese-space-4)',
        '--greese-box-p-md': '2rem',
      },
    })
  })
})
