// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compileString } from 'sass-embedded'
import { describe, expect, it } from 'vitest'

const STYLES = fileURLToPath(new URL('.', import.meta.url))

const build = (breakpoints: string): string =>
  compileString(`@use 'index' with ($breakpoints: ${breakpoints});`, {
    loadPaths: [STYLES],
  }).css

const DEFAULTS = 'xs: 0px, sm: 600px, md: 900px, lg: 1200px, xl: 1536px'
const vars = (css: string) =>
  [...css.matchAll(/--greese-breakpoint-([a-z0-9]+): ([^;]+);/g)].map((m) => [m[1], m[2]])

describe('breakpoints, fixed when the stylesheet is built', () => {
  it('declares the defaults as custom properties, in the tokens', () => {
    const tokens = readFileSync(`${STYLES}../../dist/tokens.css`, 'utf8')
    expect(vars(tokens)).toEqual([
      ['xs', '0px'],
      ['sm', '600px'],
      ['md', '900px'],
      ['lg', '1200px'],
      ['xl', '1536px'],
    ])
  })

  it('does not repeat them when built with the defaults', () => {
    expect(vars(build(`(${DEFAULTS})`)).length).toBe(5)
  })

  it('adds a key: classes, media queries and a custom property', () => {
    const css = build(
      '(xs: 0px, sm: 600px, tablet: 700px, md: 900px, lg: 1200px, xl: 1536px)'
    )
    expect(css).toContain('--greese-breakpoint-tablet: 700px;')
    expect(css).toContain('@media (width >= 700px)')
    expect(css).toContain('.greese-Stack--tablet-gap-3')
    expect(css).toContain('.greese-Stack--tablet-gap {')
    // The configured values replace the defaults in the one stylesheet.
    const last = css.lastIndexOf('--greese-breakpoint-sm')
    expect(css.slice(last)).toContain('--greese-breakpoint-sm: 600px')
  })

  it('changes values, and the custom properties follow', () => {
    const css = build('(xs: 0px, sm: 480px, md: 768px, lg: 1024px, xl: 1440px)')
    expect(css).toContain('@media (width >= 768px)')
    expect(css).not.toContain('@media (width >= 900px)')
    expect(css).toContain('--greese-breakpoint-md: 768px;')
  })

  it('takes a key that starts with a digit when quoted', () => {
    const css = build(`(${DEFAULTS}, '2xl': 1800px)`)
    expect(css).toContain('--greese-breakpoint-2xl: 1800px;')
    expect(css).toContain('.greese-Stack--2xl-gap-3')
  })

  it('keeps the keys components use, and the order', () => {
    expect(() => build('(xs: 0px, sm: 600px, md: 900px)')).toThrow(
      /must keep the key `lg`/
    )
    expect(() =>
      build('(xs: 100px, sm: 600px, md: 900px, lg: 1200px, xl: 1536px)')
    ).toThrow(/`xs` must be 0/)
    expect(() =>
      build('(xs: 0px, sm: 900px, md: 600px, lg: 1200px, xl: 1536px)')
    ).toThrow(/must increase/)
    expect(() =>
      build('(xs: 0px, sm: 600px, big-one: 700px, md: 900px, lg: 1200px, xl: 1536px)')
    ).toThrow(/one word, without dashes/)
  })
})
