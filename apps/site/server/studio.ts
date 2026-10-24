/**
 * Theme Studio's file access: a Vite dev-server plugin. The studio edits one
 * theme file, `<name>.json`, and writes what it generates next to it:
 *
 *   greese-theme.json   the theme (source of truth; read and written here)
 *   greese-theme.scss   SCSS using the kit, for apps that compile Sass
 *   greese-theme.css    the same, compiled, for apps that don't
 *   greese-theme.effects.ts  the theme's effects, for the app's `defineGreeseEffect`
 *                       (only while the theme has some)
 *
 * Choose the file with GREESE_THEME (relative to where npm was run):
 *   GREESE_THEME=src/styles/greese-theme.json npm run studio
 *
 * Dev-only by design: it writes to disk, so it never exists in a build, and
 * it only accepts requests from the dev server's own origin.
 */
import { errorLine, type ErrorAt } from '../src/studio/scssModule.ts'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
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
} from '../src/studio/importer.ts'
import type { ImportSource } from '../src/studio/api.ts'
import {
  customBreakpoints,
  emptySpec,
  specToEffectsTs,
  specToScss,
  specToScssWithLines,
  stylesheetScss,
  validateSpec,
  type ThemeSpec,
} from '../src/studio/spec.ts'

export type { ImportSource }

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')

export interface ThemeFiles {
  json: string
  scss: string
  css: string
  effects: string
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
  return { json, scss: `${base}.scss`, css: `${base}.css`, effects: `${base}.effects.ts` }
}

/**
 * `css` is what the theme's file compiles to. With breakpoints of its own that's
 * the whole stylesheet (`full`), built for them: the theme part is compiled
 * alone and the stylesheet part once per set of breakpoints.
 */
export type Compiled =
  | { scss: string; css: string; effects?: string; full?: boolean }
  | { errors: string[]; at?: ErrorAt }

const stylesheets = new Map<string, string>()

/** The theme's SCSS and CSS, compiled through the real kit. */
/**
 * When the @greese/ui this process loaded was built. The compiler runs in
 * Node, and Node keeps the first copy of a package it loads: a library
 * rebuilt while the studio runs (new effect rules, shape targets) isn't
 * picked up until the studio restarts, even by Vite's own restarts. Rather
 * than compile with the old one, and fail in ways that point elsewhere, the
 * studio says so.
 */
const LIBRARY = join(APP, '../../packages/ui/dist/index.js')
const builtAt = (): number => {
  try {
    return statSync(LIBRARY).mtimeMs
  } catch {
    return 0
  }
}
const LOADED = builtAt()

export const compileSpec = (spec: ThemeSpec, source?: string): Compiled => {
  if (builtAt() > LOADED + 1000)
    return {
      errors: [
        '@greese/ui was rebuilt after the studio started, so it can’t compile with the new library. Restart `npm run studio` (or the site’s dev server).',
      ],
    }
  const errors = validateSpec(spec)
  if (errors.length) return { errors }
  const scss = specToScss(spec, source)
  // The text compiled for the theme part, and where its lines came from.
  let compiled = specToScssWithLines(spec, source)
  const effects = specToEffectsTs(spec, source)
  const build = (text: string) =>
    compileString(text, {
      importers: [new NodePackageImporter(APP)],
      url: new URL(`file://${APP}/theme.scss`),
    }).css
  try {
    const own = customBreakpoints(spec)
    if (!own) return { scss, css: build(scss), effects }
    const key = JSON.stringify(own)
    if (!stylesheets.has(key)) stylesheets.set(key, build(stylesheetScss(own)))
    return {
      scss,
      css: `${stylesheets.get(key)}\n${build((compiled = specToScssWithLines(spec, source, 'config')).scss)}`,
      effects,
      full: true,
    }
  } catch (error) {
    // Sass errors read well; keep the first line and the kit's message.
    const message = String((error as Error).message).split('\n\n')[0]!
    const line = errorLine(error)
    const from = line === undefined ? undefined : compiled.origin(line)
    return {
      errors: [message],
      ...(from && { at: { ...from, message: message.replace(/^Error: /, '') } }),
    }
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
        // Same-origin only: the API writes files and runs imported modules.
        // Browsers send Origin with every write (PUT, POST), so one without it
        // isn't the studio: a request from another machine, say, when the dev
        // server listens on the network.
        const origin = req.headers.origin
        const write = req.method !== 'GET' && req.method !== 'HEAD'
        if ((origin || write) && origin !== `http://${req.headers.host}`)
          return send(res, 403, {})
        try {
          if (req.url === '/theme' && req.method === 'GET') {
            const spec = readSpec(files.json)
            return send(res, 200, {
              file: shown(files.json),
              outputs: [shown(files.scss), shown(files.css), shown(files.effects)],
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
            // Only a theme with effects has the file; one that dropped them drops it.
            if (result.effects) writeFileSync(files.effects, result.effects)
            else rmSync(files.effects, { force: true })
            return send(res, 200, {
              ...result,
              written: [
                files.json,
                files.scss,
                files.css,
                ...(result.effects ? [files.effects] : []),
              ].map(shown),
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
