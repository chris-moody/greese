/**
 * The docs' pages as a module, for the header's search (src/search):
 *
 *   virtual:greese-docs  every Storybook docs page, as `{ title, id }`, read
 *                        from the titles in apps/docs/stories (story files and
 *                        MDX), so a new page is searchable without a list here
 *
 * Titles only: the search chunk never loads a story or its source.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const STORIES = join(dirname(fileURLToPath(import.meta.url)), '../../docs/stories')
const ID = 'virtual:greese-docs'

/** A title's id, as Storybook makes it: `Forms/Recipes/React Hook Form` → `forms-recipes-react-hook-form`. */
export const storyId = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const TITLE = /(?:\btitle: '([^']+)'|<Meta\s+title="([^"]+)")/

export interface DocsPage {
  /** Its sidebar path: `Forms/Button`. */
  title: string
  /** Its docs page id, without `--docs`. */
  id: string
}

export const docsPages = (dir = STORIES): { pages: DocsPage[]; files: string[] } => {
  const files = readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(stories\.tsx|mdx)$/.test(file) && !file.startsWith('_'))
    .map((file) => join(dir, file))
  const pages = new Map<string, DocsPage>()
  for (const file of files) {
    const match = TITLE.exec(readFileSync(file, 'utf8'))
    const title = match?.[1] ?? match?.[2]
    // An MDX page with `of={…}` is its stories' docs page, listed already.
    if (title) pages.set(storyId(title), { title, id: storyId(title) })
  }
  return {
    pages: [...pages.values()].sort((a, b) => a.title.localeCompare(b.title)),
    files,
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
