import { describe, expect, it } from 'vitest'
import { docsPages, storyId } from './docsIndex.ts'

describe('docsIndex', () => {
  it('makes ids as Storybook does', () => {
    expect(storyId('Forms/Recipes/React Hook Form')).toBe('forms-recipes-react-hook-form')
    expect(storyId('Guides/greese.js')).toBe('guides-greese-js')
  })

  it('lists each docs page once, from story files and MDX', () => {
    const { pages } = docsPages()
    const ids = pages.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('content-accordionitem')
    expect(ids).toContain('guides-getting-started')
  })
})
