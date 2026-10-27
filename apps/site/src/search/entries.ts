import docs from 'virtual:greese-docs'
import { hrefOf } from '../router.tsx'
import { TEMPLATES } from '../templates/index.ts'

/** One thing the search can open. */
export interface SearchEntry {
  /** The heading it's listed under. */
  group: string
  title: string
  /** A line under the title: where it is, or what it is. */
  hint?: string
  href: string
  /** More words it's found by, not shown. */
  keywords?: string
}

const home = (
  id: string,
  title: string,
  hint: string,
  keywords?: string
): SearchEntry => ({
  group: 'Homepage',
  title,
  hint,
  href: hrefOf('home', `#${id}`),
  keywords,
})

const studio = (tab: string, title: string, hint: string): SearchEntry => ({
  group: 'Theme Studio',
  title,
  hint,
  href: `${hrefOf('studio')}${tab === 'tokens' ? '' : `?tab=${tab}`}`,
  keywords: 'studio theme editor',
})

/**
 * Everything the search finds: the app's pages, the homepage's sections, the
 * studio's tabs, the templates, every docs page (by its title, from
 * virtual:greese-docs) and the sections of the docs' guides. In the order shown when nothing is typed.
 */
export const ENTRIES: SearchEntry[] = [
  { group: 'Pages', title: 'Home', hint: 'greese ui', href: hrefOf('home') },
  {
    group: 'Pages',
    title: 'Theme Studio',
    hint: 'Edit a theme and see it applied',
    href: hrefOf('studio'),
  },
  {
    group: 'Pages',
    title: 'Templates',
    hint: 'Whole pages made of greese ui',
    href: hrefOf('templates'),
  },
  {
    group: 'Pages',
    title: 'Docs',
    hint: 'Guides and every component',
    href: hrefOf('docs'),
    keywords: 'documentation api props storybook',
  },
  home('why', 'Why', 'Why greese ui'),
  home('size', 'Size', 'Bundle size', 'weight bytes kb budget'),
  home('speed', 'Speed', 'Render speed', 'performance benchmark'),
  home('motion', 'Motion', 'The motion lab', 'animation greese.js'),
  home('components', 'Components', 'The component gallery', 'gallery'),
  home('optimizations', 'Optimizations', 'What keeps it light'),
  home('start', 'Get started', 'Install greese ui', 'install npm setup'),
  studio('tokens', 'Tokens', 'Colors, type, spacing and radii'),
  studio('components', 'Components', 'Per-component styles'),
  studio('shapes', 'Shapes', 'Corner and edge shapes'),
  studio('motion', 'Motion', 'Motion defaults and effects'),
  studio('code', 'Code', 'The compiled SCSS and CSS'),
  ...TEMPLATES.map((t): SearchEntry => ({
    group: 'Templates',
    title: t.title,
    hint: t.summary,
    href: hrefOf('templates', '', t.id),
    keywords: 'template page',
  })),
  ...docs.map(({ title, id }): SearchEntry => {
    const path = title.split('/')
    return {
      group: 'Docs',
      title: path.pop()!,
      hint: path.join(' / '),
      href: hrefOf('docs', '', id),
    }
  }),
  // A guide's sections: "dark mode flash" finds Theming's, and opens it there.
  ...docs.flatMap(({ title, id, headings = [] }) =>
    headings.map(([text, anchor]): SearchEntry => ({
      group: 'In the docs',
      title: text,
      hint: title.split('/').join(' / '),
      href: hrefOf('docs', `#${anchor}`, id),
    }))
  ),
]

const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean)

/**
 * How well an entry matches each typed word, or 0 if one word is missing.
 * A word scores most at the start of the title, then at the start of one of
 * its words, then anywhere in it, then in its hint, group or keywords.
 */
export const score = (entry: SearchEntry, query: string): number => {
  const title = entry.title.toLowerCase()
  const rest = `${entry.hint ?? ''} ${entry.group} ${entry.keywords ?? ''}`.toLowerCase()
  let total = 0
  for (const word of words(query)) {
    const at = title.indexOf(word)
    const points =
      at === 0
        ? 8
        : at > 0 && /[\s./-]/.test(title[at - 1]!)
          ? 6
          : at > 0
            ? 4
            : rest.includes(word)
              ? 1
              : 0
    if (!points) return 0
    total += points
  }
  // An exact title beats a longer one that starts the same.
  return title === query.trim().toLowerCase() ? total + 4 : total
}

/** The entries that match, best first, at most `limit` (all when nothing is typed). */
export const search = (query: string, entries = ENTRIES, limit = 30): SearchEntry[] => {
  if (!query.trim()) return entries
  return entries
    .map((entry, index) => ({ entry, index, score: score(entry, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((r) => r.entry)
}

/**
 * The entries grouped under their headings, groups in the order their best
 * entry ranks, so the best match is always first.
 */
export const grouped = (entries: SearchEntry[]): [string, SearchEntry[]][] => {
  const groups = new Map<string, SearchEntry[]>()
  for (const entry of entries) {
    const list = groups.get(entry.group) ?? []
    list.push(entry)
    groups.set(entry.group, list)
  }
  return [...groups]
}

/** The title split around the typed words, for highlighting: odd parts matched. */
export const highlight = (title: string, query: string): string[] => {
  const terms = words(query).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!terms.length) return [title]
  return title.split(new RegExp(`(${terms.join('|')})`, 'i'))
}
