import type { GreeseData } from './data.ts'

export interface Hit {
  kind: 'component' | 'guide' | 'template' | 'theme'
  name: string
  summary: string
  score: number
}

const words = (text: string) => text.toLowerCase().match(/[a-z0-9]+/g) ?? []

/**
 * Scores text against a query: every query word must appear; a match in the
 * name counts most, then the summary, then the body. Small and predictable,
 * which suits a few hundred documents better than an index.
 */
export const score = (query: string, name: string, summary: string, body = ''): number => {
  const terms = words(query)
  if (!terms.length) return 0
  const fields: Array<[string, number]> = [
    [name.toLowerCase(), 10],
    [summary.toLowerCase(), 3],
    [body.toLowerCase(), 1],
  ]
  let total = 0
  for (const term of terms) {
    let best = 0
    for (const [text, weight] of fields) {
      if (text === term) best = Math.max(best, weight * 3)
      else if (text.includes(term)) best = Math.max(best, weight)
    }
    if (!best) return 0
    total += best
  }
  return total
}

/** The first sentence of a description (TSDoc wraps lines mid-sentence). */
export const firstSentence = (text: string): string => {
  const flat = text.split(/\n\s*\n/)[0]!.replace(/\s+/g, ' ').trim()
  return /^.*?[.!?](?=\s|$)/.exec(flat)?.[0] ?? flat
}

/** Components, guides, templates and themes that match, best first. */
export const search = (data: GreeseData, query: string, limit = 10): Hit[] => {
  const hits: Hit[] = []
  const add = (kind: Hit['kind'], name: string, summary: string, body: string) => {
    const s = score(query, name, summary, body)
    if (s) hits.push({ kind, name, summary: firstSentence(summary), score: s })
  }
  for (const c of data.components)
    add('component', c.name, c.description, c.props.map((p) => `${p.name} ${p.description}`).join(' '))
  for (const g of data.guides) add('guide', g.name, g.title, g.text)
  for (const t of data.templates) add('template', t.id, t.description, t.source)
  for (const t of data.themes) add('theme', t.id, t.description, t.scss)
  return hits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, limit)
}
