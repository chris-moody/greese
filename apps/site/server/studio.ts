/**
 * Theme Studio's file access: a Vite dev-server plugin. The studio edits one
 * theme file, `<name>.json`, and writes what it generates next to it:
 *
 *   greese-theme.json   the theme (source of truth while you use the studio)
 *   greese-theme/       the SCSS layout (ADR 0034): a module per component,
 *                       token group and concern, to keep and edit in your source
 *   greese-theme.scss   the same SCSS as one file (the `scss` output)
 *   greese-theme.css    the theme compiled, for apps that don't compile Sass
 *   greese-theme.effects.ts  the theme's effects, for the app's `defineGreeseEffect`
 *                       (only while the theme has some)
 *
 * Choose the file with GREESE_THEME (relative to where npm was run), and what
 * is written with GREESE_THEME_OUTPUT (`layout`, `scss`, `css`; `layout,css`
 * when unset):
 *   GREESE_THEME=src/styles/greese-theme.json npm run studio
 *   GREESE_THEME_OUTPUT=scss,css npm run studio   # one file, as before
 *
 * A layout file whose first line (LAYOUT_MARK) you deleted is yours: saving
 * leaves it alone.
 *
 * Dev-only by design: it writes to disk, so it never exists in a build. It
 * answers this machine, and other devices (with `--host`, for testing on a
 * phone) only once they've opened the link it prints, which carries a token
 * (access.ts).
 */
import { errorLine, type ErrorAt } from '../src/studio/scssModule.ts'
import { studioAccess, studioToken, TOKEN_PARAM } from './access.ts'
import {
  existsSync,
  mkdirSync,
  readdirSync,
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
  LAYOUT_MARK,
  specToEffectsTs,
  specToLayout,
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
  /** The folder the SCSS layout goes in. */
  layout: string
  scss: string
  css: string
  effects: string
}

/** What saving writes: the SCSS layout, the SCSS as one file, the compiled CSS. */
export type ThemeOutput = 'layout' | 'scss' | 'css'
const OUTPUTS: readonly ThemeOutput[] = ['layout', 'scss', 'css']

export const themeOutputs = (
  setting = process.env.GREESE_THEME_OUTPUT
): ThemeOutput[] => {
  if (!setting?.trim()) return ['layout', 'css']
  const asked = setting.split(',').map((s) => s.trim())
  const unknown = asked.filter((s) => !OUTPUTS.includes(s as ThemeOutput))
  if (unknown.length)
    throw new Error(
      `GREESE_THEME_OUTPUT: no output ${unknown.map((u) => `"${u}"`).join(', ')}; choose from ${OUTPUTS.join(', ')}`
    )
  return OUTPUTS.filter((o) => asked.includes(o))
}

/**
 * Writes the SCSS layout into `dir`. A file that no longer starts with
 * LAYOUT_MARK is kept as it is: someone maintains it by hand now. A file the
 * theme no longer needs is removed, unless it's kept for the same reason.
 */
/**
 * The component files in a layout folder that are yours (their first line,
 * LAYOUT_MARK, deleted, or never there), by path inside it: `main.scss` keeps
 * loading them, whether the theme writes them or not.
 */
export const ownComponents = (dir: string): string[] => {
  const folder = join(dir, 'components')
  return existsSync(folder)
    ? readdirSync(folder)
        .filter((name) => name.endsWith('.scss'))
        .filter(
          (name) => !readFileSync(join(folder, name), 'utf8').startsWith(LAYOUT_MARK)
        )
        .sort()
        .map((name) => `components/${name}`)
    : []
}

export const writeLayout = (
  dir: string,
  files: Record<string, string>
): { written: string[]; kept: string[]; removed: string[] } => {
  const generated = (file: string) =>
    !existsSync(file) || readFileSync(file, 'utf8').startsWith(LAYOUT_MARK)
  const written: string[] = []
  const kept: string[] = []
  const removed: string[] = []
  for (const [path, text] of Object.entries(files)) {
    const file = join(dir, path)
    if (!generated(file)) {
      kept.push(file)
      continue
    }
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
    written.push(file)
  }
  const walk = (folder: string): string[] =>
    existsSync(folder)
      ? readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
          entry.isDirectory()
            ? walk(join(folder, entry.name))
            : entry.name.endsWith('.scss')
              ? [join(folder, entry.name)]
              : []
        )
      : []
  const wanted = new Set(Object.keys(files).map((path) => join(dir, path)))
  for (const file of walk(dir))
    if (!wanted.has(file) && generated(file)) {
      rmSync(file)
      removed.push(file)
    }
  return { written, kept, removed }
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
  return {
    json,
    layout: base,
    scss: `${base}.scss`,
    css: `${base}.css`,
    effects: `${base}.effects.ts`,
  }
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
  const outputs = themeOutputs()
  // What saving writes, as the studio shows it.
  const written = (shown: (file: string) => string) => [
    ...(outputs.includes('layout') ? [`${shown(files.layout)}/`] : []),
    ...(outputs.includes('scss') ? [shown(files.scss)] : []),
    ...(outputs.includes('css') ? [shown(files.css)] : []),
    shown(files.effects),
  ]
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
      const token = studioToken(join(APP, '.local/studio-token'))
      const access = studioAccess(token)
      // Beside Vite's Network URLs (only with --host): the link for another
      // device, which signs it in.
      const printUrls = server.printUrls.bind(server)
      server.printUrls = () => {
        printUrls()
        for (const url of server.resolvedUrls?.network ?? [])
          server.config.logger.info(
            `  \u279c  Studio on another device: ${url}studio?${TOKEN_PARAM}=${token}`
          )
      }
      server.middlewares.use((req, res, next) => {
        if (!access.exchange(req, res)) next()
      })
      server.watcher.add(files.json)
      server.watcher.on('change', (file) => {
        if (resolve(file) !== files.json) return
        // Our own save comes back as a change event: only report outside edits.
        if (readFileSync(file, 'utf8') === lastWrite) return
        server.ws.send({ type: 'custom', event: 'studio:theme-changed' })
      })

      server.middlewares.use('/api', async (req, res, next) => {
        if (!access.allowed(req))
          return send(res, 403, {
            errors: [
              'On another device, open the studio link `npm run studio` prints (it signs the device in).',
            ],
          })
        try {
          if (req.url === '/theme' && req.method === 'GET') {
            const spec = readSpec(files.json)
            return send(res, 200, {
              file: shown(files.json),
              outputs: written(shown),
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
            const layout = outputs.includes('layout')
              ? writeLayout(
                  files.layout,
                  specToLayout(spec, basename(files.json), {
                    components: ownComponents(files.layout),
                  })
                )
              : undefined
            if (outputs.includes('scss')) writeFileSync(files.scss, result.scss)
            if (outputs.includes('css')) writeFileSync(files.css, result.css)
            // Only a theme with effects has the file; one that dropped them drops it.
            if (result.effects) writeFileSync(files.effects, result.effects)
            else rmSync(files.effects, { force: true })
            return send(res, 200, {
              ...result,
              written: [
                shown(files.json),
                ...(layout
                  ? [`${shown(files.layout)}/ (${layout.written.length} files)`]
                  : []),
                ...(outputs.includes('scss') ? [shown(files.scss)] : []),
                ...(outputs.includes('css') ? [shown(files.css)] : []),
                ...(result.effects ? [shown(files.effects)] : []),
              ],
              kept: (layout?.kept ?? []).map(shown),
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
