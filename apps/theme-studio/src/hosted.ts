/**
 * Theme Studio without its dev server, as deployed to GitHub Pages. The
 * theme lives in this browser (localStorage), and Sass runs here: the `sass`
 * package, loaded on the first compile, against the kit's own sources
 * bundled as text, so a theme compiles exactly as `npm run studio` compiles
 * it. Saving keeps the theme here; the Code tab downloads the files.
 */
import type { Importer } from 'sass'
import kit from 'virtual:greese-kit'
import example from '../example/greese-theme.json'
import type { Compiled, ImportSource, Loaded } from './api.ts'
import { detectFormat, importCss, importJson, type ImportResult } from './importer.ts'
import {
  customBreakpoints,
  specToScss,
  stylesheetScss,
  validateSpec,
  type ThemeSpec,
} from './spec.ts'

const KEY = 'greese-theme-studio'
export const FILE = 'greese-theme.json'

const files = new Map(Object.entries(kit))

/** The package entry points the kit and themes `@use`. */
const entries: Record<string, string> = {
  'pkg:@greese/ui/scss': '/src/styles/index.scss',
  'pkg:@greese/ui/scss/config': '/src/styles/_config.scss',
  'pkg:@greese/ui/scss/kit': '/src/styles/_kit.scss',
  'pkg:@greese/ui/scss/tokens': '/dist/_tokens.scss',
  'pkg:@greese/ui/scss/layers': '/dist/_layers.scss',
  'pkg:@greese/ui/scss/maps': '/dist/_maps.scss',
}

/** Resolves `pkg:` entries, and the kit's relative `@use`s between its partials. */
export const kitImporter: Importer<'async'> = {
  canonicalize(url) {
    if (url in entries) return new URL(`file://${entries[url]}`)
    if (!url.startsWith('file:///')) return null
    const path = new URL(url).pathname.replace(/\.scss$/, '')
    const name = path.slice(path.lastIndexOf('/') + 1)
    const dir = path.slice(0, path.length - name.length)
    const found = [`${dir}_${name}.scss`, `${dir}${name}.scss`].find((p) => files.has(p))
    return found ? new URL(`file://${found}`) : null
  },
  load(url) {
    const contents = files.get(url.pathname)
    return contents === undefined ? null : { contents, syntax: 'scss' }
  },
}

const compileScss = async (scss: string): Promise<string> => {
  const sass = await import('sass')
  return (await sass.compileStringAsync(scss, { importers: [kitImporter] })).css
}

/** Sass errors read well; keep the first line and the kit's message. */
const firstPart = (error: unknown) => String((error as Error).message).split('\n\n')[0]!

/** Every component's SCSS, fetched the first time a stylesheet is built (a lazy chunk). */
let components: Promise<void> | undefined
const loadComponents = () =>
  (components ??= import('virtual:greese-stylesheet').then((m) => {
    for (const [path, text] of Object.entries(m.default)) files.set(path, text)
  }))

/** The whole stylesheet for a set of breakpoints, built once. */
const stylesheets = new Map<string, string>()

export const compileSpec = async (spec: ThemeSpec): Promise<Compiled> => {
  const errors = validateSpec(spec)
  if (errors.length) return { errors }
  const scss = specToScss(spec, FILE)
  try {
    const own = customBreakpoints(spec)
    if (!own) return { scss, css: await compileScss(scss) }
    // The stylesheet is built once per set of breakpoints; the theme alone
    // each edit.
    const key = JSON.stringify(own)
    if (!stylesheets.has(key)) {
      await loadComponents()
      stylesheets.set(key, await compileScss(stylesheetScss(own)))
    }
    const theme = await compileScss(specToScss(spec, FILE, 'config'))
    return { scss, css: `${stylesheets.get(key)}\n${theme}`, full: true }
  } catch (error) {
    return { errors: [firstPart(error)] }
  }
}

const stored = (): ThemeSpec | undefined => {
  try {
    const text = localStorage.getItem(KEY)
    return text ? (JSON.parse(text) as ThemeSpec) : undefined
  } catch {
    return undefined
  }
}

export const hostedApi = {
  load: async (): Promise<Loaded> => {
    const spec = stored() ?? (example as ThemeSpec)
    return {
      file: 'Kept in this browser',
      outputs: [],
      spec,
      ...(await compileSpec(spec)),
    }
  },
  compile: compileSpec,
  save: async (spec: ThemeSpec): Promise<Compiled & { written?: string[] }> => {
    const result = await compileSpec(spec)
    if (result.errors) return result
    try {
      localStorage.setItem(KEY, JSON.stringify(spec))
    } catch {
      return {
        errors: ['This browser won’t store the theme. Download it from the Code tab.'],
      }
    }
    return { ...result, written: ['in this browser'] }
  },
  import: async (source: ImportSource): Promise<ImportResult | { errors: string[] }> => {
    if (!('text' in source))
      return { errors: ['Project files can only be read by `npm run studio`.'] }
    try {
      const format = source.format ?? detectFormat(source.text, source.filename)
      if (format === 'json') return importJson(JSON.parse(source.text))
      const css = format === 'scss' ? await compileScss(source.text) : source.text
      return importCss(css, source.theme)
    } catch (error) {
      return { errors: [firstPart(error)] }
    }
  },
}
