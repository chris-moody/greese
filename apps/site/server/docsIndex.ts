/**
 * The docs' pages as a module, for the app's docs (src/docs) and the header's
 * search (src/search):
 *
 *   virtual:greese-docs  every page of apps/docs/stories, in the docs' order:
 *                        a component's story file (its generated page), or an
 *                        MDX guide (with its headings, for the search). Read
 *                        from the files, so a new page needs no list here
 *
 * Data only: a page's stories and MDX load when it opens (src/docs/load.ts).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { plainHeading, slugger } from '../src/docs/slug.ts'

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '../../docs')
const STORIES = join(DOCS, 'stories')
const PREVIEW = join(DOCS, '.storybook/preview.tsx')
const ID = 'virtual:greese-docs'

/** A title's id, as Storybook makes it: `Forms/Recipes/React Hook Form` → `forms-recipes-react-hook-form`. */
export const storyId = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export interface DocsPage {
  /** Its sidebar path: `Forms/Button`. */
  title: string
  /** Its id, and its path under `/docs/`: `forms-button`. */
  id: string
  /** A component's generated page from its stories, or an MDX page. */
  kind: 'component' | 'mdx'
  /** Its file, under apps/docs/stories: `forms/Button.stories.tsx`. */
  file: string
  /** An MDX page's sections, for the search: their text and ids. */
  headings?: Array<[text: string, id: string]>
}

/** The order the docs' sidebar uses, read from Storybook's preview, which defines it once. */
export type DocsOrder = Array<string | DocsOrder>

/**
 * `parameters.options.storySort.order` in preview.tsx. Storybook reads it
 * statically from the file, so it's a literal; read the same way here.
 */
export const docsOrder = (preview = readFileSync(PREVIEW, 'utf8')): DocsOrder => {
  const start = preview.indexOf('order:', preview.indexOf('storySort'))
  if (start < 0) return []
  const open = preview.indexOf('[', start)
  let depth = 0
  let end = open
  for (; end < preview.length; end++) {
    if (preview[end] === '[') depth++
    if (preview[end] === ']' && --depth === 0) break
  }
  const literal = preview
    .slice(open, end + 1)
    .replace(/'((?:[^'\\]|\\.)*)'/g, (_, s: string) => JSON.stringify(s))
    .replace(/,(\s*\])/g, '$1')
  return JSON.parse(literal) as DocsOrder
}

/**
 * Sorts titles as Storybook's `storySort.order` does: each level by its place
 * in the list (a nested list orders the level under the name before it), and
 * what a list leaves out after it, alphabetically.
 */
export const compareTitles =
  (order: DocsOrder) =>
  (a: string, b: string): number => {
    const as = a.split('/')
    const bs = b.split('/')
    let level: DocsOrder = order
    for (let i = 0; i < Math.max(as.length, bs.length); i++) {
      const x = as[i]
      const y = bs[i]
      if (x === undefined) return -1
      if (y === undefined) return 1
      if (x !== y) {
        const rank = (name: string) => {
          const at = level.indexOf(name)
          return at < 0 ? Infinity : at
        }
        const rx = rank(x)
        const ry = rank(y)
        if (rx !== ry) return rx - ry
        return x.localeCompare(y)
      }
      const at = level.indexOf(x)
      const next = level[at + 1]
      level = at >= 0 && Array.isArray(next) ? next : []
    }
    return 0
  }

/** An MDX page's `##` and `###` headings, outside code blocks, with the ids the page gives them. */
export const mdxHeadings = (source: string): Array<[string, string]> => {
  const id = slugger()
  const out: Array<[string, string]> = []
  let fenced = false
  for (const line of source.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    if (fenced) continue
    const heading = /^(#{1,4})\s+(.+?)\s*#*$/.exec(line)
    if (!heading) continue
    const text = plainHeading(heading[2]!)
    const slugged = id(text)
    // Every level takes an id, so later repeats number as on the page; the
    // search lists the sections a reader would jump to.
    if (heading[1]!.length >= 2 && heading[1]!.length <= 3) out.push([text, slugged])
  }
  return out
}

const TITLE = /\btitle:\s*'([^']+)'/
const META_TITLE = /<Meta\s+title="([^"]+)"/
const META_OF = /<Meta\s+of=\{(\w+)\}/

export const docsPages = (dir = STORIES): { pages: DocsPage[]; files: string[] } => {
  const files = readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(stories\.tsx|mdx)$/.test(file) && !file.startsWith('_'))
    .map((file) => join(dir, file))
  const pages = new Map<string, DocsPage>()
  const titleOf = new Map<string, string>()
  const read = (file: string) => readFileSync(file, 'utf8')
  const byOrder = compareTitles(docsOrder())

  for (const file of files.filter((f) => f.endsWith('.stories.tsx'))) {
    const source = read(file)
    const title = TITLE.exec(source)?.[1]
    if (!title) continue
    titleOf.set(file, title)
    // `!autodocs`: an MDX page of its own documents these stories instead.
    if (/tags:\s*\[[^\]]*'!autodocs'/.test(source)) continue
    pages.set(storyId(title), {
      title,
      id: storyId(title),
      kind: 'component',
      file: relative(dir, file),
    })
  }
  for (const file of files.filter((f) => f.endsWith('.mdx'))) {
    const source = read(file)
    let title = META_TITLE.exec(source)?.[1]
    const of = META_OF.exec(source)?.[1]
    if (!title && of) {
      // `<Meta of={Stories} />`: the page is that story file's, in its place.
      const from = new RegExp(`import \\* as ${of} from '(\\./[^']+)'`).exec(source)?.[1]
      title = from && titleOf.get(join(dirname(file), from))
    }
    if (!title) continue
    pages.set(storyId(title), {
      title,
      id: storyId(title),
      kind: 'mdx',
      file: relative(dir, file),
      headings: mdxHeadings(source),
    })
  }
  return {
    pages: [...pages.values()].sort((a, b) => byOrder(a.title, b.title)),
    files: [...files, PREVIEW],
  }
}

export const docsIndex = (): Plugin => ({
  name: 'greese-docs-index',
  resolveId: (id) => (id === ID ? `\0${id}` : undefined),
  load(id) {
    if (id !== `\0${ID}`) return
    const { pages, files } = docsPages()
    for (const file of files) this.addWatchFile(file)
    return `export default ${JSON.stringify(pages)}`
  },
})
