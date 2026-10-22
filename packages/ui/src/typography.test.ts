// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { breakpoints } from './tokens.ts'
import {
  mergeTypography,
  typeProps,
  typeVar,
  typeVariants,
  typography,
  typographyByBreakpoint,
} from './typography.ts'

describe('typography defaults', () => {
  it('has every variant, with the four core values at the smallest screen', () => {
    expect(Object.keys(typography).sort()).toEqual([...typeVariants].sort())
    for (const variant of typeVariants) {
      const base = typography[variant].base!
      for (const prop of [
        'fontSize',
        'fontWeight',
        'letterSpacing',
        'lineHeight',
      ] as const) {
        expect(base[prop], `${variant}.${prop}`).toBeTruthy()
      }
    }
  })

  it('only sets known properties at known breakpoints', () => {
    for (const variant of typeVariants) {
      for (const [point, style] of Object.entries(typography[variant])) {
        expect(point === 'base' || point in breakpoints, `${variant}.${point}`).toBe(true)
        for (const prop of Object.keys(style!))
          expect((typeProps as readonly string[]).includes(prop)).toBe(true)
      }
    }
  })

  it('sizes never shrink as the screen grows', () => {
    const rem = (v: string) => parseFloat(v)
    for (const variant of typeVariants) {
      let last = rem(typography[variant].base!.fontSize!)
      for (const [, d] of typographyByBreakpoint({ [variant]: typography[variant] })) {
        const size = d.find(([p]) => p === typeVar(variant, 'fontSize'))?.[1]
        if (size) {
          expect(rem(size), variant).toBeGreaterThanOrEqual(last)
          last = rem(size)
        }
      }
    }
  })
})

describe('mergeTypography', () => {
  it('replaces at the exact point and keeps the rest', () => {
    const merged = mergeTypography(typography, {
      h1: { base: { fontSize: '2rem' }, lg: { fontWeight: '800' } },
    })
    expect(merged.h1.base!.fontSize).toBe('2rem')
    expect(merged.h1.base!.fontWeight).toBe('700')
    expect(merged.h1.md).toEqual({ fontSize: '2.75rem' })
    expect(merged.h1.lg).toEqual({
      fontSize: '3.5rem',
      lineHeight: '1.1',
      fontWeight: '800',
    })
    expect(typography.h1.base!.fontSize).toBe('2.25rem')
  })
})

describe('tokens.css', () => {
  it('declares the defaults, base in :root and the changes in media queries', () => {
    const css = readFileSync(
      fileURLToPath(new URL('../dist/tokens.css', import.meta.url)),
      'utf8'
    )
    expect(css).toContain('--greese-type-h1-font-size: 2.25rem;')
    expect(css).toMatch(
      /@media \(width >= 900px\) \{\s+:root \{[^}]*--greese-type-h1-font-size: 2\.75rem;/
    )
    for (const variant of typeVariants) {
      expect(css, variant).toContain(`--greese-type-${variant}-font-size:`)
    }
  })
})
