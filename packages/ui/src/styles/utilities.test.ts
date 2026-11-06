// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { generateUtilities } from '../utilities.ts'
import { blocks, compileScss } from '../test/sass.ts'

describe('utilities in Sass (pkg:@greese/ui/scss/utilities)', () => {
  /** Each block's place, selector and declarations: the CSS, formatting aside. */
  const shape = (css: string) =>
    blocks(css)
      .filter((b) => b.declarations.length)
      .map((b) => [...b.within, b.prelude, ...b.declarations.flat()].join(' | '))

  const sass = (call: string, use = '') =>
    compileScss(`${use}\n@use 'utilities';\n@include utilities.classes${call};`)

  it('writes what generateUtilities() writes', () => {
    expect(shape(sass(''))).toEqual(shape(generateUtilities()))
  })

  it('takes the build’s breakpoints, groups, a prefix and a purge list', () => {
    const breakpoints = { xs: 0, sm: 480, tablet: 700, md: 768, lg: 1024, xl: 1440 }
    const custom = `@use 'config' with ($breakpoints: (${Object.entries(breakpoints)
      .map(([k, v]) => `${k}: ${v}px`)
      .join(', ')}));`
    expect(shape(sass('($groups: (spacing, layout), $prefix: g)', custom))).toEqual(
      shape(
        generateUtilities({ groups: ['spacing', 'layout'], prefix: 'g', breakpoints })
      )
    )
    const used = new Set(['p-4', 'md-display-flex', 'hover-opacity-75'])
    expect(shape(sass(`($only: (${[...used].join(', ')}))`))).toEqual(
      shape(generateUtilities({ used }))
    )
  })

  it('stops the build on an unknown group', () => {
    expect(() => sass('($groups: (spaces))')).toThrow(/no group `spaces`/)
  })
})
