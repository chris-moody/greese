/**
 * The guides (apps/docs/stories/guides/*.mdx) say true things: what their
 * samples import exists and type-checks, their links land, and the classes
 * and custom properties they name are ones the library has.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { PAGES } from './pages.ts'
import { plainHeading, slugger } from './slug.ts'

const SITE = join(dirname(fileURLToPath(import.meta.url)), '../..')
const ROOT = join(SITE, '../..')
const GUIDES = join(ROOT, 'apps/docs/stories/guides')

interface Fence {
  lang: string
  code: string
  line: number
}

const guides = readdirSync(GUIDES)
  .filter((f) => f.endsWith('.mdx'))
  .map((file) => {
    const source = readFileSync(join(GUIDES, file), 'utf8')
    const fences: Fence[] = []
    // The prose: the guide with its code blocks taken out.
    const prose = source.replace(
      /^```(\w*)[^\n]*\n([\s\S]*?)^```/gm,
      (whole, lang: string, code: string, at: number) => {
        fences.push({ lang, code, line: source.slice(0, at).split('\n').length })
        return whole.replace(/[^\n]/g, ' ')
      }
    )
    return { file, source, prose, fences }
  })

const allText = guides.map((g) => g.source).join('\n')

/** Every stylesheet the library ships, and the source that sets properties from script. */
const shipped = (() => {
  const files = (dir: string, ext: RegExp): string[] =>
    readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((d) => d.isFile() && ext.test(d.name))
      .map((d) => readFileSync(join(d.parentPath, d.name), 'utf8'))
  return [
    ...files(join(ROOT, 'packages/ui/dist'), /\.css$/),
    ...files(join(ROOT, 'packages/ui/themes'), /\.css$/),
    ...files(join(ROOT, 'packages/ui/src'), /\.(ts|scss)$/),
    ...files(join(ROOT, 'packages/react/src'), /\.tsx?$/),
    ...files(join(ROOT, 'packages/js/src'), /\.ts$/),
  ].join('\n')
})()

describe('the guides', () => {
  it('are all found', () => {
    expect(guides.length).toBeGreaterThanOrEqual(10)
  })

  it('link to their own headings and to pages the docs have', () => {
    const broken: string[] = []
    for (const { file, prose } of guides) {
      const id = slugger()
      const headings = new Set(
        [...prose.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => id(plainHeading(m[1]!)))
      )
      for (const [, anchor] of prose.matchAll(/\]\(#([^)]+)\)/g))
        if (!headings.has(anchor!)) broken.push(`${file}: #${anchor}`)
      for (const [, page] of prose.matchAll(/\]\(\?path=\/docs\/([\w-]+?)--docs\)/g))
        if (!PAGES.some((p) => p.id === page)) broken.push(`${file}: ${page}`)
    }
    expect(broken).toEqual([])
  })

  it('import only paths the packages export', () => {
    const require = createRequire(join(SITE, 'package.json'))
    const missing: string[] = []
    for (const { file, fences } of guides)
      for (const { code } of fences)
        for (const [, path] of code.matchAll(/(?:from|import)\s+'(@greese\/[^']+)'/g)) {
          try {
            require.resolve(path!)
          } catch {
            missing.push(`${file}: ${path}`)
          }
        }
    expect(missing).toEqual([])
  })

  it('name only classes the library has', () => {
    const named = new Set(
      [
        ...allText.matchAll(
          /\bgreese-[A-Z][A-Za-z]*(?:-[a-z][A-Za-z]*)?(?:--[a-z][\w-]*)?/g
        ),
      ].map((m) => m[0])
    )
    // `greese-Name`, `greese-Name-part`: the naming pattern, not a class.
    const unknown = [...named].filter(
      (name) => !/^greese-Name\b/.test(name) && !shipped.includes(`.${name}`)
    )
    expect(unknown).toEqual([])
  })

  it('name only custom properties the library sets or reads', () => {
    const named = new Set(
      [...allText.matchAll(/--greese-[a-z0-9]+(?:-[a-z0-9]+)*(-[<*])?/g)]
        // `--greese-motion-<role>`, `--greese-duration-*`: a family, not a name.
        .filter((m) => !m[1])
        .map((m) => m[0])
    )
    const unknown = [...named].filter(
      (name) => !new RegExp(`${name}(?![\\w-])`).test(shipped)
    )
    expect(unknown).toEqual([])
  })

  it('show TypeScript that type-checks against the packages', () => {
    const samples = new Map<string, { file: string; line: number }>()
    for (const { file, fences } of guides)
      fences
        .filter((f) => f.lang === 'ts' || f.lang === 'tsx')
        // Each sample is a module of its own.
        .forEach((f, i) => {
          const path = join(SITE, 'src/__guides__', `${file}.${i}.${f.lang}`)
          samples.set(path, { file, line: f.line })
          sources.set(path, asModule(f.code, f.lang === 'tsx'))
        })
    const program = ts.createProgram([...samples.keys()], options, host)
    const wrong = ts
      .getPreEmitDiagnostics(program)
      .filter((d) => d.file && samples.has(d.file.fileName) && !IGNORED.has(d.code))
      // `…` in an element stands for props left out: required ones among them.
      .filter((d) => {
        const line = d.file!.getLineAndCharacterOfPosition(d.start ?? 0).line
        return !(
          MISSING_PROPS.has(d.code) && d.file!.text.split('\n')[line]!.includes('…')
        )
      })
      // Only what the packages say: a sample may lean on names and modules of its own.
      .map((d) => {
        const { file } = samples.get(d.file!.fileName)!
        const text = d.file!.text
        const at = d.file!.getLineAndCharacterOfPosition(d.start ?? 0).line
        return `${file} TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}\n    ${text.split('\n')[at]!.trim()}`
      })
    expect(wrong).toEqual([])
  })
})

const options: ts.CompilerOptions = {
  strict: true,
  noEmit: true,
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  lib: ['lib.es2023.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  allowImportingTsExtensions: true,
  skipLibCheck: true,
  types: [],
}

/** The samples, by the path they're checked at; everything else is read from disk. */
const sources = new Map<string, string>()
const host = ts.createCompilerHost(options)
const read = host.readFile
host.readFile = (path) => sources.get(path) ?? read(path)
const exists = host.fileExists
host.fileExists = (path) => sources.has(path) || exists(path)

/** What `@greese/react` exports, by name, as TypeScript resolves it. */
const reactExports = (() => {
  const probe = join(SITE, 'src/__guides__/exports.ts')
  sources.set(probe, "export * as react from '@greese/react'\n")
  const program = ts.createProgram([probe], options, host)
  const checker = program.getTypeChecker()
  const module = checker.getSymbolAtLocation(program.getSourceFile(probe)!)!
  const [react] = checker.getExportsOfModule(module)
  return new Set(
    checker.getExportsOfModule(checker.getAliasedSymbol(react!)).map((e) => e.name)
  )
})()

/**
 * A sample as a module TypeScript can check, the way a reader takes it: a
 * guide's samples sketch, with JSX written on its own after the code that
 * sets it up, several elements side by side, `…` for what's left out, and
 * components used without the import line. Each run of JSX at the top level
 * becomes a fragment, each `…` a comment, and anything `@greese/react`
 * exports that the sample uses without importing or declaring it is imported,
 * so its props are checked too.
 */
const asModule = (code: string, jsx: boolean): string => {
  let body = code.replaceAll('…', '/* … */')
  if (jsx) {
    const out: string[] = []
    let open = false
    for (const line of body.split('\n')) {
      // A closing tag at the margin ends JSX that the sample opened itself.
      const inRun: boolean =
        /^<(?!\/)/.test(line) ||
        (open && (/^\s/.test(line) || line === '' || /^</.test(line)))
      if (inRun && !open) out.push(';<>')
      if (!inRun && open) out.push('</>')
      open = inRun
      // A note after an element (`// wraps in a <div>`) stays a comment.
      out.push(inRun ? line.replace(/\s\/\/\s?(.*)$/, ' {/* $1 */}') : line)
    }
    if (open) out.push('</>')
    body = out.join('\n')
  }
  const declared = new Set(
    [
      ...body.matchAll(
        /(?:import\s*(?:type\s*)?\{([^}]*)\}|(?:const|let|function|class|type|interface)\s+(\w+))/g
      ),
    ].flatMap(([, list, name]) =>
      name
        ? [name]
        : list!.split(',').map((i) =>
            i
              .trim()
              .replace(/^type /, '')
              .split(/\s+as\s+/)
              .at(-1)!
          )
    )
  )
  const used = new Set(
    [...body.matchAll(/(?<![\w.'"-])([A-Za-z]\w*)\b/g)]
      .map((m) => m[1]!)
      .filter((name) => reactExports.has(name) && !declared.has(name))
  )
  const imports = used.size
    ? `import { ${[...used].join(', ')} } from '@greese/react'\n`
    : ''
  return `${imports}${body}\nexport {}\n`
}

/** A required prop missing, which `…` in the element may stand for. */
const MISSING_PROPS = new Set([2741, 2739])

/**
 * What a sample may leave out: names it uses but doesn't declare (an app's own
 * `user`, a `theme` from the step before), modules that aren't greese ui's,
 * and the loose ends of a fragment.
 */
const IGNORED = new Set([
  2304, // Cannot find name
  2552, // Cannot find name; did you mean
  2307, // Cannot find module (not ours: ours are checked above)
  2451, // Cannot redeclare (two steps of one example)
  2393, // Duplicate function implementation
  6133, // Declared but never read
  7006, // Parameter implicitly has an 'any' type
  7031, // Binding element implicitly has an 'any' type
  1375, // top-level await
  1378, // top-level await target
  2875, // JSX needs react/jsx-runtime types (React's own types aren't loaded)
  2882, // A side-effect import (a stylesheet): resolved above
  2591, // Node's own modules (node:fs): their types aren't loaded
])
