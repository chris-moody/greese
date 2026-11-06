// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { manifestScss, styleManifest } from './styleManifest.ts'

const compiled = new Map([
  [
    'Thing',
    `@layer greese.components {
  .greese-Thing { --greese-thing-tone: var(--greese-color-accent); color: var(--greese-thing-fg, red); }
  .greese-Thing--solid, .greese-Thing--size-sm { border: 0; }
  .greese-Thing[data-loading] .greese-Thing-icon { opacity: 0; }
  .greese-Thing-step--next { order: 1; }
  .greese-ThingItem + .greese-ThingItem::before { content: '/'; }
  @media (width >= 900px) {
    .greese-Thing--md-width-full { inline-size: 100%; }
    .greese-Thing--md-width { inline-size: var(--greese-thing-width-md); }
  }
  .greese-Thing { --greese-loose-end: 1px; }
}`,
  ],
])

describe('styleManifest', () => {
  const { blocks } = styleManifest(compiled, new Set(['--greese-color-accent']))

  it('finds blocks, parts, modifiers and the sheet that defines them', () => {
    expect(Object.keys(blocks)).toEqual(['Thing', 'ThingItem'])
    expect(blocks.Thing).toMatchObject({
      className: 'greese-Thing',
      stylesheet: 'Thing',
      parts: ['icon', 'step'],
      modifiers: ['size-sm', 'solid'],
      partModifiers: { step: ['next'] },
      attributes: ['[data-loading]'],
    })
    expect(blocks.ThingItem!.stylesheet).toBe('Thing')
  })

  it('groups responsive classes by prop, apart from modifiers', () => {
    expect(blocks.Thing!.responsive).toEqual({ width: ['full'] })
  })

  it('keeps component variables, not tokens or per-breakpoint values', () => {
    expect(blocks.Thing!.variables).toEqual([
      '--greese-loose-end',
      '--greese-thing-fg',
      '--greese-thing-tone',
    ])
  })

  it('records where each class sits and what its rules set', () => {
    const { blocks: nested } = styleManifest(
      new Map([
        [
          'Card',
          `@layer greese.components {
  .greese-Card { display: grid; }
  .greese-Card-head .greese-Card-title { font-weight: 600; }
  .greese-Card-head > .greese-Card-title:not(.greese-Card--flat) { color: red; }
  .greese-Card-media { inline-size: 100%; }
  @media (hover: hover) { .greese-Card--flat:hover { box-shadow: none; } }
  @keyframes spin { to { rotate: 1turn; } }
}`,
        ],
      ]),
      new Set()
    )
    expect(nested.Card!.classes).toEqual({
      'greese-Card': { properties: ['display'] },
      'greese-Card--flat': { parent: 'greese-Card', properties: ['box-shadow'] },
      'greese-Card-head': { parent: 'greese-Card', properties: [] },
      'greese-Card-media': { parent: 'greese-Card', properties: ['inline-size'] },
      'greese-Card-title': {
        parent: 'greese-Card-head',
        properties: ['color', 'font-weight'],
      },
    })
  })

  it('records state attributes on the class that carries them', () => {
    expect(blocks.Thing!.states['[data-loading]']).toEqual({
      on: ['greese-Thing'],
      properties: ['opacity'],
    })
  })

  it("records each variable's default, what sets it, and what it ends up in", () => {
    const { blocks: themed } = styleManifest(
      new Map([
        [
          'Chip',
          `@layer greese.components {
  .greese-Chip { --greese-chip-tone: var(--greese-color-accent); --greese-chip-bg: var(--greese-chip-tone); background-color: var(--greese-chip-bg); padding: var(--greese-chip-pad, 4px); transition: color var(--greese-chip-speed); }
  .greese-Chip--neutral { --greese-chip-tone: gray; }
  .greese-Chip[data-on] { --greese-chip-bg: black; }
}`,
        ],
      ]),
      new Set(['--greese-color-accent'])
    )
    expect(themed.Chip!.variableInfo).toEqual({
      '--greese-chip-bg': {
        default: 'var(--greese-chip-tone)',
        setBy: ['[data-on]'],
        affects: ['background-color'],
        type: 'color',
      },
      '--greese-chip-pad': {
        default: '4px',
        setBy: [],
        affects: ['padding'],
        type: 'length',
      },
      '--greese-chip-speed': { setBy: [], affects: ['transition'], type: 'transition' },
      '--greese-chip-tone': {
        default: 'var(--greese-color-accent)',
        setBy: ['greese-Chip--neutral'],
        affects: ['background-color'],
        type: 'color',
      },
    })
  })

  it('renders a Sass map for the kit', () => {
    expect(manifestScss({ version: 4, blocks })).toContain(
      `'Thing': (\n    parts: ('icon', 'step',),\n    modifiers: ('size-sm', 'solid',),\n    part-modifiers: ('step': ('next',)),`
    )
  })
})
