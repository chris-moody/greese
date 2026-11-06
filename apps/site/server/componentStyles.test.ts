import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { familySource } from '../src/studio/copySource.ts'
import { familyOf } from '../src/studio/family.ts'
import { blocks } from '../src/studio/manifest.ts'
import { validateSpec, type ThemeSpec } from '../src/studio/spec.ts'
import { withoutResetGuards } from '../src/studio/importer.ts'
import { compileSpec } from './studio.ts'
import { rules } from '../../../packages/ui/src/test/sass.ts'

const UI = join(process.cwd(), '../../packages/ui')

/** The SCSS a component's Styles box starts with, as the Studio builds it. */
const startingScss = async (component: string): Promise<string> => {
  const names = await familyOf(component)
  const sheets = [...new Set(names.map((name) => blocks[name]!.stylesheet))].map(
    (sheet): [string, string] => {
      const path = `src/components/${sheet}/${sheet}.scss`
      return [path, readFileSync(join(UI, path), 'utf8')]
    }
  )
  return familySource(
    sheets,
    blocks[component]!.className,
    names.map((name) => blocks[name]!.className)
  )
}

describe('a component family', () => {
  it('is the component, its items and what they are built on, from the library’s own data', async () => {
    expect(await familyOf('Accordion')).toEqual([
      'Accordion',
      'AccordionItem',
      'Collapsible',
    ])
    expect(await familyOf('AccordionItem')).toEqual(['AccordionItem', 'Collapsible'])
    expect(await familyOf('Collapsible')).toEqual(['Collapsible'])
  })
})

describe('the SCSS a Styles box starts with', () => {
  it('holds every stylesheet of the family once, imports at the top, the component as &', async () => {
    const scss = await startingScss('Accordion')
    expect(scss.indexOf('// src/components/Accordion/Accordion.scss')).toBeGreaterThan(0)
    expect(scss).toContain('// src/components/Collapsible/Collapsible.scss')
    expect(scss.split('// src/components/Accordion/Accordion.scss')).toHaveLength(2)
    expect(scss).toContain('.greese-Collapsible-trigger {')
    expect(scss).not.toMatch(/\.greese-Accordion[\s{,]/)
    expect(scss).not.toContain('@layer')
    const body = scss.slice(scss.indexOf('//'))
    expect(body).not.toMatch(/^@use/m)
  })

  it('leaves out what belongs to the component it sits in', async () => {
    const scss = await startingScss('AccordionItem')
    expect(scss).not.toMatch(/\.greese-Accordion[\s{,>]/)
    expect(scss).toContain('.greese-Collapsible-trigger {')
  })

  it('compiles for every component with a family, inside its own component()', async () => {
    const components: ThemeSpec['components'] = {}
    for (const name of ['Accordion', 'AccordionItem', 'Collapsible', 'Tabs', 'Field']) {
      if (blocks[name]) components[name] = { scss: await startingScss(name) }
    }
    const compile = (only: ThemeSpec['components']) => {
      const spec: ThemeSpec = { tokens: {}, components: only }
      const errors = validateSpec(spec)
      return errors.length ? { errors } : compileSpec(spec)
    }
    // All in one theme compiles the kit once; each alone only to name a failure.
    if (!('errors' in compile(components))) return
    const failures = Object.entries(components).flatMap(([name, component]) => {
      const result = compile({ [name]: component })
      return 'errors' in result ? [`${name}: ${result.errors[0]!.split('\n')[0]}`] : []
    })
    expect(failures).toEqual([])
  }, 60_000)
})

describe('editing a family in the theme', () => {
  const edited = async (): Promise<ThemeSpec> => ({
    tokens: {},
    components: {
      Accordion: {
        scss: (await startingScss('Accordion')).replace(
          /(\.greese-Collapsible-trigger \{)/,
          '$1\n  min-block-size: 5rem;'
        ),
      },
    },
  })

  /** What encloses each rule for `selector` that carries the edit. */
  const wrapping = (css: string, selector: string) =>
    rules(css, selector)
      .filter((r) =>
        r.declarations.some(([p, v]) => p === 'min-block-size' && v === '5rem')
      )
      .map((r) => r.within)

  it('applies inside the component it was edited from, and nowhere else', async () => {
    const result = compileSpec(await edited())
    expect(result).not.toHaveProperty('errors')
    const out = withoutResetGuards((result as { css: string }).css)
    expect(wrapping(out, '.greese-Accordion .greese-Collapsible-trigger')).toEqual([
      ['@layer greese.overrides'],
    ])
    expect(wrapping(out, '.greese-Collapsible-trigger')).toEqual([])
  })

  it('keeps a named theme’s scope, since the kit nests the rules itself', async () => {
    const out = withoutResetGuards(
      (compileSpec({ ...(await edited()), name: 'brand' }) as { css: string }).css
    )
    expect(
      wrapping(
        out,
        '[data-greese-theme=brand] .greese-Accordion .greese-Collapsible-trigger'
      )
    ).toHaveLength(1)
  })

  it('reports scss it cannot use', () => {
    for (const scss of ['.a { b: c', '} .a { b: c }', '@use "x";'])
      expect(validateSpec({ tokens: {}, components: { Card: { scss } } })[0]).toMatch(
        /Card scss:/
      )
  })
})
