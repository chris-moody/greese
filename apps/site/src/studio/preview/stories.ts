/**
 * The docs' own stories, reused: each component's story file from
 * apps/docs/stories, composed with Storybook's portable-stories API so its
 * args, decorators and renders apply as in the docs. Loaded lazily, one
 * file at a time, when a component is featured.
 */
import type { ComponentType } from 'react'
import { composeStories } from '@storybook/react'
import { storyNameFromExport } from 'storybook/internal/csf'

type StoryModule = Parameters<typeof composeStories>[0]

const files = import.meta.glob<StoryModule>('../../../../docs/stories/**/*.stories.tsx')
// The same files as text, for their export order: a module namespace lists
// exports alphabetically, and the docs show them in source order.
const sources = import.meta.glob<string>('../../../../docs/stories/**/*.stories.tsx', {
  query: '?raw',
  import: 'default',
})

/** Story file paths by component name: `Button` → …/forms/Button.stories.tsx. */
const pathOf = new Map(
  Object.keys(files).map((path) => [
    path.split('/').pop()!.replace('.stories.tsx', ''),
    path,
  ])
)

/** Story files by component name: `Button` → forms/Button.stories.tsx. */
const byName = new Map(
  Object.entries(files).map(([path, load]) => [
    path.split('/').pop()!.replace('.stories.tsx', ''),
    load,
  ])
)

export const hasStories = (name: string): boolean => byName.has(name)

/** A composed story: a component with its args and decorators applied. */
type ComposedStory = ComponentType & {
  parameters?: { layout?: 'padded' | 'centered' | 'fullscreen' }
}

export interface LoadedStories {
  /** The docs title: `Forms/Button`. */
  title: string
  stories: Array<[name: string, Story: ComposedStory]>
}

export const loadStories = async (name: string): Promise<LoadedStories | undefined> => {
  const load = byName.get(name)
  if (!load) return undefined
  const module = await load()
  const composed = composeStories(module) as unknown as Record<string, ComposedStory>
  const source = sources[pathOf.get(name)!]
  const text = source ? await source() : ''
  const order = [...text.matchAll(/^export const (\w+)/gm)].map((m) => m[1]!)
  const keys = [...new Set([...order, ...Object.keys(composed)])].filter(
    (k) => k in composed
  )
  return {
    title: String(module.default.title ?? name),
    // Named as the docs name them: `VariantsAndTones` → "Variants And Tones".
    stories: keys.map((key) => [
      (module as unknown as Record<string, { name?: string }>)[key]?.name ??
        storyNameFromExport(key),
      composed[key]!,
    ]),
  }
}
