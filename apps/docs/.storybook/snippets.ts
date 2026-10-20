/**
 * The code Storybook generates for each story ("Show code"), kept by story
 * id. Storybook emits it once, when the story renders, so this listens from
 * the moment the preview loads; the live editor reads it later.
 */
import { addons } from 'storybook/preview-api'
import { SNIPPET_RENDERED } from 'storybook/internal/docs-tools'
import { unwrapFragments } from './source.ts'

const snippets = new Map<string, string>()
const listeners = new Set<() => void>()

addons
  .getChannel()
  .on(SNIPPET_RENDERED, ({ id, source }: { id: string; source?: string }) => {
    if (!source || snippets.get(id) === source) return
    snippets.set(id, unwrapFragments(source))
    for (const listener of listeners) listener()
  })

/** The latest snippet for a story, if it has rendered. */
export const snippetFor = (id: string): string | undefined => snippets.get(id)

/** Calls back whenever any snippet arrives; returns the unsubscribe. */
export const onSnippet = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
