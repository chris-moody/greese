/**
 * Theme Studio's file access: a Vite dev-server plugin. The studio edits one
 * theme file, `<name>.json`, and writes what it generates next to it:
 *
 *   greese-theme.json   the theme (source of truth; read and written here)
 *   greese-theme.scss   SCSS using the kit, for apps that compile Sass
 *   greese-theme.css    the same, compiled, for apps that don't
 *
 * Choose the file with GREESE_THEME (relative to where npm was run):
 *   GREESE_THEME=src/styles/greese-theme.json npm run studio
 *
 * Dev-only by design: it writes to disk, so it never exists in a build, and
 * it only accepts requests from the dev server's own origin.
 */
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { compile, compileString, NodePackageImporter } from 'sass-embedded'
import type { Plugin } from 'vite'
import {
  detectFormat,
  importCss,
  importJson,
  importThemeOptions,
  type ImportResult,
} from '../src/importer.ts'
import type { ImportSource } from '../src/api.ts'
import {
  customBreakpoints,
  emptySpec,
  specToScss,
  stylesheetScss,
  validateSpec,
  type ThemeSpec,
} from '../src/spec.ts'

export type { ImportSource }

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')

export interface ThemeFiles {
  json: string
  scss: string
  css: string
}

/** The theme the studio starts from, and the hosted studio's (src/hosted.ts). */
export const exampleFile = join(APP, 'example/greese-theme.json')

export const themeFiles = (
  setting = process.env.GREESE_THEME,
  cwd = process.env.INIT_CWD ?? process.cwd()
): ThemeFiles => {
  // With no file named, the studio works on a local copy of the example, so
  // saving never rewrites the example the hosted studio starts from.
  const json = setting ? resolve(cwd, setting) : join(APP, '.local/greese-theme.json')
  const base = json.replace(/\.json$/, '')
  return { json, scss: `${base}.scss`, css: `${base}.css` }
}

/**
 * `css` is what the theme's file compiles to. With breakpoints of its own that's
 * the whole stylesheet (`full`), built for them: the theme part is compiled
 * alone and the stylesheet part once per set of breakpoints.
 */
export type Compiled =
  { scss: string; css: string; full?: boolean } | { errors: string[] }

const stylesheets = new Map<string, string>()

/** The theme's SCSS and CSS, compiled through the real kit. */
export const compileSpec = (spec: ThemeSpec, source?: string): Compiled => {
  const errors = validateSpec(spec)
  if (errors.length) return { errors }
  const scss = specToScss(spec, source)
  const build = (text: string) =>
    compileString(text, {
      importers: [new NodePackageImporter(APP)],
      url: new URL(`file://${APP}/theme.scss`),
    }).css
  try {
    const own = customBreakpoints(spec)
    if (!own) return { scss, css: build(scss) }
    const key = JSON.stringify(own)
    if (!stylesheets.has(key)) stylesheets.set(key, build(stylesheetScss(own)))
    return {
      scss,
      css: `${stylesheets.get(key)}\n${build(specToScss(spec, source, 'config'))}`,
      full: true,
    }
  } catch (error) {
    // Sass errors read well; keep the first line and the kit's message.
    return { errors: [String((error as Error).message).split('\n\n')[0]!] }
  }
}

const sassOptions = { importers: [new NodePackageImporter(APP)] }

/** A file's path, if it's inside `root` (symlinks resolved). */
const inside = (root: string, path: string): string => {
  const file = resolve(root, path)
  if (!existsSync(file)) throw new Error(`No such file: ${path}`)
  const real = realpathSync(file)
  const base = realpathSync(root)
  if (real !== base && !real.startsWith(base + sep))
    throw new Error(`Only files inside ${base} can be imported.`)
  return real
}

const isTheme = (v: unknown): v is { name: string; css: string } =>
  !!v && typeof v === 'object' && typeof (v as { css?: unknown }).css === 'string'

const isOptions = (v: unknown): v is Record<string, unknown> =>
  !!v &&
  typeof v === 'object' &&
  !isTheme(v) &&
  [
    'color',
    'radius',
    'space',
    'font',
    'lineHeight',
    'shadow',
    'typography',
    'extend',
  ].some((k) => k in (v as object))

/**
 * Imports an existing theme as a studio spec. Text and files are read as
 * JSON, CSS or SCSS (compiled with the kit available); a `.ts`/`.js` module
 * is imported and its exported `createTheme()` results (or options) used.
 * Modules run in this process, so only files inside `root` are accepted.
 */
export const importTheme = async (
  source: ImportSource,
  root = process.env.INIT_CWD ?? process.cwd()
): Promise<ImportResult> => {
  if ('text' in source) {
    const format = source.format ?? detectFormat(source.text, source.filename)
    if (format === 'json') return importJson(JSON.parse(source.text))
    const css =
      format === 'scss'
        ? compileString(source.text, {
            ...sassOptions,
            loadPaths: [root],
            url: pathToFileURL(join(root, source.filename ?? 'import.scss')),
          }).css
        : source.text
    return importCss(css, source.theme)
  }

  const file = inside(root, source.path)
  const ext = extname(file).toLowerCase()
  if (ext === '.json') return importJson(JSON.parse(readFileSync(file, 'utf8')))
  if (ext === '.css') return importCss(readFileSync(file, 'utf8'), source.theme)
  if (ext === '.scss') return importCss(compile(file, sassOptions).css, source.theme)
  if (['.ts', '.mts', '.js', '.mjs'].includes(ext)) {
    // A fresh URL each time, so an edited module is read again.
    const module = (await import(
      `${pathToFileURL(file).href}?t=${Date.now()}`
    )) as Record<string, unknown>
    const values = Object.values(module)
    const themes = values.filter(isTheme)
    if (themes.length) return importCss(themes.map((t) => t.css).join('\n'), source.theme)
    const options = values.find(isOptions)
    if (options) return importThemeOptions(options)
    throw new Error(`${source.path} exports no createTheme() result or options.`)
  }
  throw new Error(
    `Can't import ${ext || 'that'} files: use .json, .css, .scss, .ts or .js.`
  )
}

const readSpec = (file: string): ThemeSpec =>
  existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as ThemeSpec)
    : file === themeFiles(undefined).json
      ? (JSON.parse(readFileSync(exampleFile, 'utf8')) as ThemeSpec)
      : emptySpec()

const body = async (req: IncomingMessage): Promise<ThemeSpec> => {
  let text = ''
  for await (const chunk of req) text += chunk
  return JSON.parse(text) as ThemeSpec
}

const send = (res: ServerResponse, status: number, data: unknown) => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(data))
}

export const studio = (): Plugin => {
  const files = themeFiles()
  // Relative to where npm ran, unless that climbs out of it.
  const shown = (file: string) => {
    const rel = relative(process.env.INIT_CWD ?? process.cwd(), file)
    return rel.startsWith('..') ? file : rel
  }
  let lastWrite = ''

  return {
    name: 'greese-theme-studio',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(files.json)
      server.watcher.on('change', (file) => {
        if (resolve(file) !== files.json) return
        // Our own save comes back as a change event: only report outside edits.
        if (readFileSync(file, 'utf8') === lastWrite) return
        server.ws.send({ type: 'custom', event: 'studio:theme-changed' })
      })

      server.middlewares.use('/api', async (req, res, next) => {
        // Same-origin only: the API writes files.
        const origin = req.headers.origin
        if (origin && origin !== `http://${req.headers.host}`) return send(res, 403, {})
        try {
          if (req.url === '/theme' && req.method === 'GET') {
            const spec = readSpec(files.json)
            return send(res, 200, {
              file: shown(files.json),
              outputs: [shown(files.scss), shown(files.css)],
              spec,
              ...compileSpec(spec, basename(files.json)),
            })
          }
          if (req.url === '/compile' && req.method === 'POST') {
            const result = compileSpec(await body(req), basename(files.json))
            return send(res, 'errors' in result ? 422 : 200, result)
          }
          if (req.url === '/import' && req.method === 'POST') {
            const source = (await body(req)) as unknown as ImportSource
            try {
              return send(res, 200, await importTheme(source))
            } catch (error) {
              const message = String((error as Error).message).split('\n\n')[0]!
              return send(res, 422, { errors: [message] })
            }
          }
          if (req.url === '/theme' && req.method === 'PUT') {
            const spec = await body(req)
            const result = compileSpec(spec, basename(files.json))
            if ('errors' in result) return send(res, 422, result)
            mkdirSync(dirname(files.json), { recursive: true })
            lastWrite = `${JSON.stringify(spec, null, 2)}\n`
            writeFileSync(files.json, lastWrite)
            writeFileSync(files.scss, result.scss)
            writeFileSync(files.css, result.css)
            return send(res, 200, {
              ...result,
              written: [files.json, files.scss, files.css].map(shown),
            })
          }
        } catch (error) {
          return send(res, 400, { errors: [String((error as Error).message)] })
        }
        next()
      })
    },
  }
}
