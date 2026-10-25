import { describe, expect, it } from 'vitest'
import { blockNeeds, criticalBlocks, missingBlocks, withRoot } from './prerender.ts'

describe('prerender', () => {
  it("puts the app's HTML in the empty root, and only there", () => {
    const page =
      '<body><div id="root"></div><script type="module" src="/x.js"></script></body>'
    expect(withRoot(page, '<h1>Hi</h1>')).toBe(
      '<body><div id="root"><h1>Hi</h1></div><script type="module" src="/x.js"></script></body>'
    )
  })

  it('fails the build rather than ship a page it could not fill', () => {
    expect(() => withRoot('<div id="app"></div>', '<h1>Hi</h1>')).toThrow(
      /no <div id="root">/
    )
  })

  it('finds the stylesheets the HTML needs that the first-screen CSS leaves out', () => {
    const html =
      '<div class="greese-Button greese-Button--solid"><span class="greese-Drawer"></span><i class="greese-Switch"></i></div>'
    // Drawer has no stylesheet of its own (Dialog's covers it); a Switch's
    // label is ChoiceGroup's.
    const needs = (b: string): string[] =>
      ({ Button: ['Button'], Drawer: ['Dialog'], Switch: ['ChoiceGroup', 'Switch'] })[
        b
      ] ?? []
    expect(missingBlocks(html, ['Button', 'Dialog', 'Switch'], needs)).toEqual([
      'ChoiceGroup',
    ])
    expect(
      missingBlocks(html, ['Button', 'ChoiceGroup', 'Dialog', 'Switch'], needs)
    ).toEqual([])
  })

  it("reads a block's needs from the library's per-component stylesheets", () => {
    expect(blockNeeds('Switch')).toEqual(['ChoiceGroup', 'Field', 'Switch'])
    expect(blockNeeds('Type')).toEqual(['Type'])
    expect(blockNeeds('Nothing')).toEqual([])
  })

  it('reads the list from firstScreen.ts', () => {
    expect(
      criticalBlocks(
        "import '@greese/ui/css/core.css'\nimport '@greese/ui/css/Button.css'\n"
      )
    ).toEqual(['Button'])
  })
})
