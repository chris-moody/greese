/**
 * A heading's id, as GitHub (and Storybook's docs) make it, so the guides'
 * own `#links` land: lowercased, punctuation dropped, spaces as hyphens.
 * "Brand themes: createTheme" → `brand-themes-createtheme`.
 *
 * Shared by the build (server/docsIndex.ts, which lists headings for the
 * search) and the page, which gives each heading its id.
 */
export const slug = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-')

/**
 * Ids for a page's headings in order: a repeated heading gets `-1`, `-2`…,
 * as GitHub numbers them.
 */
export const slugger = (): ((text: string) => string) => {
  const seen = new Map<string, number>()
  return (text) => {
    const base = slug(text)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count ? `${base}-${count}` : base
  }
}

/** Markdown inline syntax off a heading's source: what its text reads as. */
export const plainHeading = (markdown: string): string =>
  markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .trim()
