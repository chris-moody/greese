// @vitest-environment jsdom
/**
 * Every component page's Try it starts from code the live editor can run: each
 * component its starting code names is in the editor's scope (liveScope.ts).
 * A package whose components have pages but not a place in the scope fails
 * here, rather than as `ReferenceError: Highlighted is not defined` on the page,
 * and so does starting code that throws when it runs.
 */
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { generateElement } from 'react-live'
import { describe, expect, it } from 'vitest'
import { loadStories } from './load.ts'
import { LIVE_SCOPE, transformCode } from './liveScope.ts'
import { PAGES } from './pages.ts'
import { storyContext } from './StoryCanvas.tsx'
import { minifiableNames, storyScope, storySnippet } from './toJsx.ts'

const pages = PAGES.filter((page) => page.kind === 'component')

/** The starting code, worked out inside a render as LiveCode does: renders may call hooks. */
const startingCode = async (
  file: string
): Promise<{
  code: string
  scope: Set<string>
  helpers: Set<string>
  values: Record<string, unknown>
} | null> => {
  const { meta, stories } = await loadStories(file)
  const primary = stories[0]
  if (!primary || !meta.component || meta.parameters?.tryIt === false) return null
  let code = ''
  minifiableNames.clear()
  const Probe = () => {
    const story = primary.Story
    code = storySnippet(
      primary.annotation.render ?? meta.render,
      meta.component,
      story.args,
      storyContext(story, meta, story.args),
      [...(primary.annotation.decorators ?? []), ...(meta.decorators ?? [])]
    )
    return null
  }
  renderToString(<Probe />)
  const helpers = new Set(Object.keys(storyScope(meta.parameters)))
  return {
    code,
    helpers,
    values: { ...LIVE_SCOPE, ...storyScope(meta.parameters) },
    scope: new Set([
      ...Object.keys(LIVE_SCOPE),
      ...Object.keys(storyScope(meta.parameters)),
    ]),
  }
}

describe('Try it', () => {
  it('has pages to check', () => {
    expect(pages.length).toBeGreaterThan(100)
  })

  it.each(pages.map((page) => [page.id, page.file] as const))(
    '%s names only components in scope',
    async (_, file) => {
      const start = await startingCode(file)
      if (!start) return
      const tags = [...start.code.matchAll(/<([A-Z][\w$]*)/g)].map((m) => m[1]!)
      expect(tags.filter((tag) => !start.scope.has(tag))).toEqual([])
      // Named by a function's own name, which minifies in the built site: give
      // the component a `displayName`, or put its package in liveScope.ts.
      expect([...minifiableNames].filter((name) => !start.helpers.has(name))).toEqual([])
      // And it runs: compiled as the editor compiles it, rendered once.
      const Example = generateElement(
        { code: transformCode(start.code), scope: start.values, enableTypeScript: true },
        (error) => {
          throw error
        }
      )
      expect(() => renderToString(createElement(Example))).not.toThrow()
    }
  )
})
