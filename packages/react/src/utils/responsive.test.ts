import type { CSSProperties } from 'react'
import { describe, expect, it } from 'vitest'
import {
  isSpaceToken,
  neverToken,
  resolveResponsive,
  responsiveClass,
  responsivePropClass,
  responsiveVar,
  spaceToCss,
  type ResponsiveConfig,
} from './responsive.ts'

const gap: ResponsiveConfig = {
  block: 'sauce-Stack',
  prop: 'gap',
  isToken: isSpaceToken,
  toCss: spaceToCss,
}
const direction: ResponsiveConfig = { block: 'sauce-Stack', prop: 'direction' }

describe('naming', () => {
  it('builds class and variable names the SCSS mixin also builds', () => {
    expect(responsiveClass('sauce-Stack', 'md', 'gap', 2)).toBe('sauce-Stack--md-gap-2')
    expect(responsiveVar('sauce-Stack', 'gap', 'md')).toBe('--sauce-stack-gap-md')
    expect(responsivePropClass('sauce-Stack', 'gap')).toBe('sauce-Stack--gap')
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
    expect(spaceToCss(4)).toBe('var(--sauce-space-4)')
    expect(spaceToCss('13px')).toBe('13px')
    expect(neverToken()).toBe(false)
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
      className: 'sauce-Stack--gap sauce-Stack--xs-gap-2',
      style: undefined,
    })
  })

  it('maps token values to classes and others to inline variables, per breakpoint', () => {
    const { className, style } = resolveResponsive(
      [
        [{ xs: 1, md: '2.5rem', lg: 6 }, gap],
        [{ xs: 'column', md: 'row' }, direction],
      ],
      { className: 'sauce-Stack' }
    )
    expect(className).toBe(
      'sauce-Stack sauce-Stack--gap sauce-Stack--xs-gap-1 sauce-Stack--lg-gap-6 ' +
        'sauce-Stack--direction sauce-Stack--xs-direction-column sauce-Stack--md-direction-row'
    )
    expect(style).toEqual({ '--sauce-stack-gap-md': '2.5rem' })
  })

  it('emits breakpoints smallest first regardless of key order', () => {
    const { className } = resolveResponsive([
      [{ xl: 'row', xs: 'column', sm: 'row' }, direction],
    ])
    expect(className).toBe(
      'sauce-Stack--direction sauce-Stack--xs-direction-column ' +
        'sauce-Stack--sm-direction-row sauce-Stack--xl-direction-row'
    )
  })

  it('skips breakpoints set to undefined or null', () => {
    const { className } = resolveResponsive([
      [{ xs: undefined, md: null as unknown as string, lg: 'row' }, direction],
    ])
    expect(className).toBe('sauce-Stack--direction sauce-Stack--lg-direction-row')
  })

  it('lets caller style override generated variables', () => {
    const { style } = resolveResponsive([['13px', gap]], {
      style: { '--sauce-stack-gap-xs': '1px', color: 'red' } as CSSProperties,
    })
    expect(style).toEqual({ '--sauce-stack-gap-xs': '1px', color: 'red' })
  })

  it('treats every value as a token when isToken is omitted', () => {
    const { className, style } = resolveResponsive([
      [7, { block: 'sauce-Grid', prop: 'columns' }],
    ])
    expect(className).toBe('sauce-Grid--columns sauce-Grid--xs-columns-7')
    expect(style).toBeUndefined()
  })

  it('converts inline values with toCss, tokens included when isToken says no', () => {
    const space: ResponsiveConfig = {
      block: 'sauce-Box',
      prop: 'p',
      isToken: neverToken,
      toCss: spaceToCss,
    }
    expect(resolveResponsive([[{ xs: 4, md: '2rem' }, space]])).toEqual({
      className: 'sauce-Box--p',
      style: { '--sauce-box-p-xs': 'var(--sauce-space-4)', '--sauce-box-p-md': '2rem' },
    })
  })
})
