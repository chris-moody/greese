// @vitest-environment node
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compile, NodePackageImporter } from 'sass-embedded'

const css = compile(join(process.cwd(), 'src/styles/index.scss'), {
  importers: [new NodePackageImporter(process.cwd())],
}).css

describe('the stylesheet', () => {
  it('opens with greese’s layer order, whichever sheet loads first', () => {
    expect(css.trimStart()).toMatch(
      /^(\/\*[^]*?\*\/\s*)?@layer greese\.reset, greese\.tokens, greese\.theme, greese\.base, greese\.components, greese\.overrides, greese\.utilities;/
    )
  })

  it('draws larger text controls at sm inside the authoring theme', () => {
    for (const control of ['Input', 'Select', 'Textarea'])
      for (const size of ['md', 'lg', 'xl'])
        expect(css).toContain(`.greese-AuthoringTheme .greese-${control}--size-${size}`)
    expect(css).toMatch(/--greese-input-height: 2rem/)
    expect(css).toContain('.greese-AuthoringTheme .greese-EditableField-label')
  })
})
