import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { compileSpec as compileInBrowser, FILE, hostedApi } from '../src/hosted.ts'
import type { ThemeSpec } from '../src/spec.ts'
import { compileSpec, themeFiles } from './studio.ts'

const example = JSON.parse(readFileSync(themeFiles(undefined).json, 'utf8')) as ThemeSpec

describe('the hosted studio', () => {
  it('compiles a theme exactly as the dev server does', async () => {
    for (const spec of [example, { ...example, name: 'ocean' }]) {
      const served = compileSpec(spec, FILE)
      expect(await compileInBrowser(spec)).toEqual(served)
    }
  })

  it('imports SCSS that uses the kit', async () => {
    const result = await hostedApi.import({
      text: "@use 'pkg:@greese/ui/scss/kit' as greese;\n@include greese.tokens((color: (primary: #0e7490)));",
      format: 'scss',
    })
    expect(result).not.toHaveProperty('errors')
    expect(JSON.stringify(result)).toContain('#0e7490')
  })

  it('reports what only the dev server can do', async () => {
    expect(await hostedApi.import({ path: 'theme.ts' })).toHaveProperty('errors')
  })
})
