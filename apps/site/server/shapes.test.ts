import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyMotion, MOTIONS, motionIn } from '../src/studio/motions.ts'
import { applyPreset, COLOR_THEMES, PRESETS } from '../src/studio/presets.ts'
import { applyShape, SHAPES, shapeIn } from '../src/studio/shapes.ts'
import { applyVariant, VARIANTS, variantIn } from '../src/studio/variants.ts'
import { bevel } from '@greese/ui/shapes'
import { shapesScss, validateSpec, type ThemeSpec } from '../src/studio/spec.ts'
import { compileSpec } from './studio.ts'
import { withoutResetGuards } from '../src/studio/importer.ts'
import { themeFile } from './shapes.ts'
import { blocks } from '../../../packages/ui/src/test/sass.ts'

const themes = join(import.meta.dirname, '../../../packages/ui/themes')

/** A comma-separated CSS value's items, not splitting inside parentheses. */
const topLevel = (value: string): string[] => {
  const items = ['']
  let depth = 0
  for (const ch of value) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && !depth) items.push('')
    else items[items.length - 1] += ch
  }
  return items
}

/** Each `@keyframes greese-*` in the CSS: its name and its steps, as data. */
const keyframes = (css: string) => {
  const found = new Map<string, Array<[string, Array<[string, string]>]>>()
  for (const { within, prelude, declarations } of blocks(css)) {
    const name = /^@keyframes greese-([a-z-]+)$/.exec(within.at(-1) ?? '')?.[1]
    if (name) found.set(name, [...(found.get(name) ?? []), [prelude, declarations]])
  }
  return found
}

/** Every built-in entrance's keyframes, as @greese/ui's Motion styles write them. */
// Every effect's own keyframes: entrances (Motion.css), and the exits a page
// transition's old page plays (PageTransition.css, ADR 0029).
const builtIn = keyframes(
  ['Motion', 'PageTransition']
    .map((name) =>
      readFileSync(
        join(import.meta.dirname, `../../../packages/ui/dist/css/${name}.css`),
        'utf8'
      )
    )
    .join('\n')
)

describe('theme layers (ADR 0025)', () => {
  it.each([
    ...COLOR_THEMES.map((p) => [p.id, p, 'color'] as const),
    ...SHAPES.map((p) => [p.id, p, 'shape'] as const),
    ...MOTIONS.map((p) => [p.id, p, 'motion'] as const),
    ...VARIANTS.map((p) => [p.id, p, 'variant'] as const),
  ])(
    '%s: its files in @greese/ui are current (npm run themes -w site)',
    (id, preset, kind) => {
      const { scss, css } = themeFile(preset, kind)
      expect(readFileSync(join(themes, `${id}.scss`), 'utf8')).toBe(scss)
      expect(readFileSync(join(themes, `${id}.css`), 'utf8')).toBe(css)
    }
  )

  const fields = (spec: ThemeSpec) => ({
    tokens: Object.keys(spec.tokens ?? {}).sort(),
    top: Object.keys(spec)
      .filter((k) => k !== 'tokens' && k !== 'components')
      .sort(),
    component: [
      ...new Set(Object.values(spec.components ?? {}).flatMap((c) => Object.keys(c))),
    ].sort(),
  })

  it('keeps each layer to its own fields', () => {
    for (const preset of PRESETS.filter((p) => Object.keys(p.color).length))
      expect(fields(applyPreset({}, preset))).toEqual({
        tokens: ['color'],
        top: [],
        component: [],
      })
    for (const preset of SHAPES)
      expect(fields(applyShape({}, preset)), preset.id).toEqual({
        tokens: ['corner'],
        top: ['shapes'],
        // A theme of radii and depth styles components but shapes none.
        component: Object.keys(preset.shapes).length ? ['scss', 'shape'] : ['scss'],
      })
    // A color variant: modifiers and root declarations only, never a shape theme's SCSS.
    for (const variant of VARIANTS)
      expect(fields(applyVariant({}, variant))).toEqual({
        tokens: [],
        top: [],
        component: ['modifiers', 'styles'],
      })
    for (const preset of MOTIONS)
      // Only role assignments: no tokens, effects or component styles of its own.
      expect(fields(applyMotion({}, preset))).toEqual({
        tokens: [],
        top: ['motionDefaults'],
        component: [],
      })
  })

  it('wears a color variant with every shape theme, and drops it alone', () => {
    for (const shape of SHAPES) {
      const spec = applyVariant(applyShape({}, shape), VARIANTS[0])
      expect(shapeIn(spec)?.id).toBe(shape.id)
      expect(variantIn(spec)?.id).toBe(VARIANTS[0]!.id)
      expect(applyVariant(spec, undefined)).toEqual(applyShape({}, shape))
      expect(compileSpec(spec)).not.toHaveProperty('errors')
    }
  })

  it('composes one of each, and swaps one without touching the others', () => {
    const own: ThemeSpec = {
      components: { Tabs: { styles: { gap: '0' } } },
      tokens: { space: { 4: '1.1rem' } },
    }
    const ocean = PRESETS.find((p) => p.id === 'ocean')!
    let spec = applyMotion(applyShape(applyPreset(own, ocean), SHAPES[0]), MOTIONS[2])
    expect(shapeIn(spec)?.id).toBe('bevel')
    expect(motionIn(spec)?.id).toBe('wipe')
    expect(spec.tokens!.color).toEqual(ocean.color)

    spec = applyShape(spec, SHAPES[3])
    expect(shapeIn(spec)?.id).toBe('folio')
    expect(motionIn(spec)?.id).toBe('wipe')
    expect(spec.tokens!.color).toEqual(ocean.color)
    expect(Object.keys(spec.shapes!).every((n) => n.startsWith('folio-'))).toBe(true)

    spec = applyMotion(spec, MOTIONS[0])
    expect(motionIn(spec)?.id).toBe('snappy')
    expect(shapeIn(spec)?.id).toBe('folio')
    expect(spec.motionDefaults).toEqual(MOTIONS[0]!.defaults)

    // Removing both leaves the colors and the theme's own edits.
    const plain = applyMotion(applyShape(spec, undefined), undefined)
    expect(shapeIn(plain)).toBeUndefined()
    expect(motionIn(plain)).toBeUndefined()
    expect(plain.components).toEqual(own.components)
    expect(plain.tokens).toEqual({ ...own.tokens, color: ocean.color })
    expect(plain.shapes ?? {}).toEqual({})
  })

  const SHAPED = SHAPES.filter((s) => Object.keys(s.shapes).length)
  const DEPTH = SHAPES.filter((s) => !Object.keys(s.shapes).length)

  it.each(DEPTH.map((s) => [s.id, s] as const))(
    '%s: reassigns radius roles, and draws everything inside the box so masks and clips keep it',
    (_id, preset) => {
      const css = themeFile(preset, 'shape').css.replace(/\/\*[\s\S]*?\*\//g, '')
      expect(
        Object.values(preset.corner).every((r) =>
          /^var\(--greese-radius-[a-z]+\)$/.test(r)
        )
      ).toBe(true)
      expect(css).not.toMatch(/--greese-radius-[a-z]+:/)
      expect(css).not.toMatch(/clip-path|@keyframes|\bmask/)
      // Depth is inset shadows only: an outer one would be cut by a motion theme's mask.
      for (const [, shadow] of css.matchAll(/box-shadow: ([^;]+);/g))
        for (const layer of topLevel(shadow!))
          expect(layer.trim(), shadow).toMatch(/^inset /)
      // Nothing rests turned: a motion theme's turns start and end where it sits.
      for (const [rule] of css.matchAll(/[^{}]*\{[^{}]*transform: perspective[^{}]*\}/g))
        expect(rule, rule).toMatch(/:hover|:active|aria-selected/)
      expect(preset.sample).toBeDefined()
    }
  )

  it.each(SHAPED.map((s) => [s.id, s] as const))(
    '%s: square corners, focus for every shaped component, no clip animation',
    (_id, preset) => {
      const css = withoutResetGuards(themeFile(preset, 'shape').css)
      // Every radius role reassigned to the scale's `none`; the scale keeps its values.
      expect(
        Object.values(preset.corner).every((r) => r === 'var(--greese-radius-none)')
      ).toBe(true)
      expect(css).not.toMatch(/--greese-radius-[a-z]+:/)
      for (const name of ['Button', 'Card', 'Input'])
        expect(css).toMatch(
          new RegExp(`\\.greese-${name}(:focus-visible|:has\\(:focus-visible\\))`)
        )
      expect(css).not.toMatch(/transition:[^;]*clip-path/)
      expect(css).not.toMatch(/@keyframes/)
      expect(css).not.toMatch(/\bmask:/)
    }
  )

  it.each(MOTIONS.map((m) => [m.id, m] as const))(
    '%s: reveals with masks, never clip-path, and only for those who allow motion',
    (_id, preset) => {
      const { css } = themeFile(preset, 'motion')
      expect(css).not.toMatch(/clip-path/)
      // It assigns roles: which effect plays where, which timing it takes.
      expect(css).toMatch(/--greese-motion-content: greese-[a-z-]+;/)
      expect(css).toMatch(/--greese-motion-rows: greese-[a-z-]+;/)
      expect(css).toMatch(/--greese-motion-theme: greese-[a-z-]+;/)
      // It never redefines an effect or a token: the keyframes it carries are
      // the effects' own, and no duration or easing token changes.
      const carried = keyframes(css)
      expect(carried.size).toBeGreaterThan(0)
      for (const [name, steps] of carried) expect(steps, name).toEqual(builtIn.get(name))
      expect(css).not.toMatch(/--greese-(duration|easing|radius)-[a-z]+:/)
      expect(css).not.toMatch(/--greese-color-/)
    }
  )
})

describe('shapes in a theme spec', () => {
  it('checks names, points, parameters and assignments', () => {
    const errors = validateSpec({
      shapes: {
        Bad: { points: [] },
        ok: {
          points: [
            { x: {}, y: {} },
            { x: { pct: 100 }, y: {} },
            { x: { param: 'A-1' }, y: { pct: 100 } },
          ],
          params: { a: Number.NaN },
        },
      },
      components: { Button: { shape: 'missing' } },
    })
    expect(errors).toEqual(
      expect.arrayContaining([
        'shapes: "Bad" is not a kebab-case name',
        'shapes.Bad: a shape needs at least 3 points',
        'shapes.ok point 3 x.param: "A-1" is not a parameter name',
        'shapes.ok.params.a: not a number of px',
        'Button shape: the theme has no shape named "missing"',
      ])
    )
  })

  it('writes each shape as a class, and on the components that take it', () => {
    const spec: ThemeSpec = {
      shapes: { cut: bevel(8) },
      components: { Button: { shape: 'cut' }, Card: { styles: { gap: '0' } } },
    }
    const scss = shapesScss(spec)
    expect(scss).toMatch(/@property --greese-shape-a \{/)
    expect(scss).toMatch(/@layer greese\.overrides \{/)
    // Through the kit: a component's selector is guarded for the shape layer.
    expect(scss).toContain('#{greese.themed(".greese-Button", Button)}')
    expect(scss).toContain('#{greese.themed(".greese-shape-cut")}')
    expect(scss).not.toMatch(/greese-Card/)
    const compiled = compileSpec(spec)
    expect('css' in compiled && withoutResetGuards(compiled.css)).toMatch(
      /\.greese-shape-cut,\s*\.greese-Button \{\s*--greese-shape-a: 8px;/
    )
  })

  it('scopes them to a named theme', () => {
    const compiled = compileSpec({ name: 'brand', shapes: { cut: bevel() } })
    expect('css' in compiled && compiled.css).toMatch(
      /:where\(\[data-greese-theme=brand\]\) \.greese-shape-cut/
    )
  })

  it('compile through the kit like the rest of the theme', () => {
    const compiled = compileSpec({
      shapes: { cut: bevel() },
      components: { Button: { shape: 'cut' } },
    })
    expect('errors' in compiled ? compiled.errors : []).toEqual([])
    expect('css' in compiled && withoutResetGuards(compiled.css)).toMatch(
      /\.greese-Button::after \{/
    )
  })
})
