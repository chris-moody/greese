import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { compileString } from 'sass-embedded'
import { afterAll, describe, expect, it } from 'vitest'
import {
  generateUtilities,
  purgeUtilities,
  scanContent,
  utilityClasses,
} from './utilities.ts'
import { contentFiles, purgeFiles } from './utilitiesFiles.ts'
import { greeseUtilities, UTILITIES_MODULE } from './vite.ts'

const byName = (name: string) => utilityClasses().find((c) => c.name === name)

describe('utility classes', () => {
  it('have one definition per name', () => {
    const names = utilityClasses().map((c) => c.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names.length).toBeGreaterThan(2000)
    for (const name of names) expect(name, name).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  it('are named for the property and the value, with the spacing sides', () => {
    expect(byName('p-4')?.declarations).toEqual({ padding: 'var(--greese-space-4)' })
    expect(byName('mt-2')?.declarations).toEqual({
      'margin-top': 'var(--greese-space-2)',
    })
    expect(byName('mx-auto')?.declarations).toEqual({ 'margin-inline': 'auto' })
    expect(byName('ms-3')?.declarations).toEqual({
      'margin-inline-start': 'var(--greese-space-3)',
    })
    expect(byName('pe-1')?.declarations).toEqual({
      'padding-inline-end': 'var(--greese-space-1)',
    })
    expect(byName('display-flex')?.declarations).toEqual({ display: 'flex' })
    expect(byName('text-align-center')?.declarations).toEqual({
      'text-align': 'center',
    })
    expect(byName('justify-content-between')?.declarations).toEqual({
      'justify-content': 'space-between',
    })
    expect(byName('flex-direction-column')?.declarations).toEqual({
      'flex-direction': 'column',
    })
  })

  it('take their values from the tokens', () => {
    expect(byName('background-primary')?.declarations).toEqual({
      'background-color': 'var(--greese-color-primary)',
    })
    expect(byName('background-surface-overlay')).toBeDefined()
    expect(byName('radius-md')?.declarations).toEqual({
      'border-radius': 'var(--greese-radius-md)',
    })
    expect(byName('z-modal')?.declarations).toEqual({
      'z-index': 'var(--greese-z-index-modal)',
    })
    expect(byName('font-weight-bold')).toBeDefined()
    expect(byName('shadow-lg')).toBeDefined()
  })

  it('make several declarations where one would not do', () => {
    expect(byName('truncate')?.declarations).toMatchObject({
      overflow: 'hidden',
      'text-overflow': 'ellipsis',
      'white-space': 'nowrap',
    })
    expect(byName('border-t')?.declarations).toMatchObject({
      'border-top-width': '1px',
    })
    expect(byName('border-t-0')?.declarations).toEqual({ 'border-top-width': '0' })
  })

  it('add breakpoints and hover to the groups that opt in', () => {
    expect(byName('md-display-flex')?.variant).toBe('md')
    expect(byName('xl-p-4')).toBeDefined()
    expect(byName('xs-p-4')).toBeUndefined()
    expect(byName('hover-opacity-75')?.variant).toBe('hover')
    expect(byName('md-cursor-pointer')).toBeUndefined()
  })

  it('can be limited to groups, given another prefix, and use your breakpoints', () => {
    const names = utilityClasses({
      prefix: 'g',
      groups: ['spacing'],
      breakpoints: { xs: 0, tablet: 700 },
    }).map((c) => c.name)
    expect(names).toContain('g-p-4')
    expect(names).toContain('g-tablet-p-4')
    expect(names).not.toContain('g-md-p-4')
    expect(names).not.toContain('g-display-flex')
  })
})

describe('generateUtilities', () => {
  const css = generateUtilities()

  it('is valid CSS in the utilities layer, mobile first', () => {
    expect(() => compileString(css)).not.toThrow()
    expect(css).toContain('@layer greese.reset')
    expect(css).toContain('@layer greese.utilities {')
    const at = (text: string) => css.indexOf(text)
    expect(at('.p-4 {')).toBeLessThan(at('@media (hover: hover)'))
    expect(at('@media (hover: hover)')).toBeLessThan(at('@media (width >= 600px)'))
    expect(at('@media (width >= 600px)')).toBeLessThan(at('@media (width >= 900px)'))
    expect(at('@media (width >= 900px)')).toBeLessThan(at('@media (width >= 1200px)'))
    expect(css).toMatch(/\.hover-opacity-75:hover \{\s+opacity: 0\.75;/)
  })

  it('writes only the classes asked for', () => {
    const small = generateUtilities({ used: new Set(['p-4', 'md-display-flex']) })
    expect(small).toContain('.p-4 {')
    expect(small).toContain('@media (width >= 900px)')
    expect(small).toContain('.md-display-flex {')
    expect(small).not.toContain('.p-3 ')
    expect(small).not.toContain('hover: hover')
    expect(generateUtilities({ used: new Set() })).not.toContain('greese.utilities {')
  })
})

describe('purging', () => {
  it('finds names as whole words in any text', () => {
    const found = scanContent(
      `<div class="p-4 md-display-flex">{cond && 'hidden'}</div> className={cx('mt-2')}`
    )
    expect(found.has('p-4')).toBe(true)
    expect(found.has('md-display-flex')).toBe(true)
    expect(found.has('mt-2')).toBe(true)
  })

  it('keeps only the classes the content spells out', () => {
    const css = purgeUtilities({
      content: ['<p class="text-align-center pt-3">hi</p>', 'const x = "p-40"'],
    })
    expect(css).toContain('.text-align-center {')
    expect(css).toContain('.pt-3 {')
    // A longer word that only starts with a class name is not that class.
    expect(css).not.toContain('.p-4 {')
    expect(css.length).toBeLessThan(1000)
  })

  it('keeps the safelist, for classes built at run time', () => {
    const css = purgeUtilities({
      content: ['`p-${n}`'],
      safelist: ['m-0', /^p-[0-2]$/],
    })
    expect(css).toContain('.m-0 {')
    expect(css).toContain('.p-1 {')
    expect(css).not.toContain('.p-3 {')
  })
})

describe('reading files', () => {
  let dir: string
  afterAll(() => dir && rm(dir, { recursive: true, force: true }))
  const setup = async () => {
    dir = await mkdtemp(join(tmpdir(), 'greese-utilities-'))
    await mkdir(join(dir, 'src'))
    await mkdir(join(dir, 'node_modules/pkg'), { recursive: true })
    await writeFile(join(dir, 'index.html'), '<main class="display-grid"></main>')
    await writeFile(join(dir, 'src/App.tsx'), '<a className="hover-opacity-75" />')
    await writeFile(join(dir, 'node_modules/pkg/x.js'), '"position-fixed"')
  }

  it('globs the content, skipping node_modules, and purges what it finds', async () => {
    await setup()
    const files = await contentFiles({
      content: ['index.html', '**/*.tsx', '**/*.js'],
      cwd: dir,
    })
    expect(files.map((f) => f.replace(dir, ''))).toEqual(['/index.html', '/src/App.tsx'])
    const { css } = await purgeFiles({
      content: ['index.html', 'src/**/*.tsx'],
      cwd: dir,
    })
    expect(css).toContain('.display-grid {')
    expect(css).toContain('.hover-opacity-75:hover')
    expect(css).not.toContain('position-fixed')
  })

  it('serves the purged css as a virtual module, and refreshes it when a file changes', async () => {
    await setup()
    const plugin = greeseUtilities({ content: ['index.html'], cwd: dir })
    const id = plugin.resolveId(UTILITIES_MODULE)!
    expect(plugin.resolveId('other')).toBeUndefined()
    const watched: string[] = []
    const css = await plugin.load.call({ addWatchFile: (f) => watched.push(f) }, id)
    expect(css).toContain('.display-grid {')
    expect(watched).toEqual([join(dir, 'index.html')])
    const module = { id }
    const invalidated: unknown[] = []
    const server = {
      moduleGraph: {
        getModuleById: () => module,
        invalidateModule: (m: unknown) => invalidated.push(m),
      },
    }
    expect(plugin.handleHotUpdate({ file: join(dir, 'index.html'), server })).toEqual([
      module,
    ])
    expect(invalidated).toEqual([module])
    expect(
      plugin.handleHotUpdate({ file: join(dir, 'other.txt'), server })
    ).toBeUndefined()
  })
})
