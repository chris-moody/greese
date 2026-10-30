/**
 * A docs page's content, loaded when it opens: a component's story file,
 * composed with Storybook's portable-stories API so its args, decorators and
 * renders apply as they do in Storybook, or an MDX page compiled by the
 * build (vite.config.ts). Each file is a chunk of its own.
 */
import type { ComponentType, JSX } from 'react'
import { composeStories, composeStory } from '@storybook/react'
import { storyNameFromExport } from 'storybook/internal/csf'
import type { MDXComponents } from 'mdx/types'
import type { Decorator } from './toJsx.ts'
import { once } from '../pages/chunks.ts'

type StoryModule = Parameters<typeof composeStories>[0]
type MdxModule = {
  default: (props: { components?: MDXComponents }) => JSX.Element
}

const STORIES = '../../../docs/stories/'
const storyFiles = import.meta.glob<StoryModule>('../../../docs/stories/**/*.stories.tsx')
// The same files as text: their export order (a module namespace lists exports
// alphabetically), and the comment above each story, which is its description.
const storySources = import.meta.glob<string>('../../../docs/stories/**/*.stories.tsx', {
  query: '?raw',
  import: 'default',
})
const mdxFiles = import.meta.glob<MdxModule>('../../../docs/stories/**/*.mdx')

/** The args and argTypes a story's controls work with. */
export type Args = Record<string, unknown>

export interface ArgType {
  control?: string | false | { type?: string }
  options?: readonly unknown[]
  description?: string
  table?: { disable?: boolean }
}

/** A story composed for rendering: its args, decorators and render applied. */
export type ComposedStory = ComponentType<Args> & {
  id: string
  args: Args
  argTypes: Record<string, ArgType>
  parameters: { layout?: 'padded' | 'centered' | 'fullscreen' } & Record<string, unknown>
}

/** A story's raw annotations, from its file: what "Show code" renders from. */
export interface StoryAnnotation {
  name?: string
  args?: Args
  render?: (args: Args, context: Record<string, unknown>) => unknown
  decorators?: Decorator[]
}

export interface Meta {
  title?: string
  component?: ComponentType<Args>
  subcomponents?: Record<string, ComponentType>
  args?: Args
  render?: StoryAnnotation['render']
  decorators?: Decorator[]
  /**
   * `tryIt: false` leaves the page's Try it section out; `tryIt: { scope }`
   * names the story file's own helpers the example uses (`{ Replay }`), for
   * its code and the live editor.
   */
  parameters?: Record<string, unknown>
}

export interface LoadedStory {
  /** Its export: `VariantsAndTones`. */
  key: string
  /** As the docs name it: "Variants And Tones", or its `name`. */
  name: string
  Story: ComposedStory
  annotation: StoryAnnotation
  /** The comment above its export, if any. */
  description?: string
}

export interface LoadedStories {
  meta: Meta
  /** The comment above the file's meta: its page's description, over the component's. */
  description?: string
  stories: LoadedStory[]
}

/** The comment directly above each `export const`, by export name. */
export const storyComments = (source: string): Map<string, string> => {
  const comments = new Map<string, string>()
  for (const match of source.matchAll(
    /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*export const (\w+)/g
  )) {
    const text = match[1]!
      .split('\n')
      .map((line) => line.replace(/^\s*\* ?/, ''))
      .join('\n')
      .trim()
    if (text) comments.set(match[2]!, text)
  }
  return comments
}

/** The comment directly above the file's `const meta`, or its `export default`. */
export const metaComment = (source: string): string | undefined => {
  const match =
    /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*(?:const meta\b|export default\b)/.exec(source)
  const text = match?.[1]
    ?.split('\n')
    .map((line) => line.replace(/^\s*\* ?/, ''))
    .join('\n')
    .trim()
  return text || undefined
}

/** The `export const` names in source order. */
export const exportOrder = (source: string): string[] =>
  [...source.matchAll(/^export const (\w+)/gm)].map((m) => m[1]!)

/** A story file, `forms/Button.stories.tsx`, composed. */
export const loadStories = async (file: string): Promise<LoadedStories> => {
  const path = STORIES + file
  const [module, source] = await Promise.all([
    storyFiles[path]!(),
    storySources[path]?.() ?? '',
  ])
  const composed = composeStories(module) as unknown as Record<string, ComposedStory>
  const raw = module as unknown as Record<string, StoryAnnotation> & { default: Meta }
  const comments = storyComments(source)
  const keys = [...new Set([...exportOrder(source), ...Object.keys(composed)])].filter(
    (key) => key in composed
  )
  return {
    meta: raw.default,
    description: metaComment(source),
    stories: keys.map((key) => ({
      key,
      name: raw[key]?.name ?? storyNameFromExport(key),
      Story: composed[key]!,
      annotation: raw[key]!,
      description: comments.get(key),
    })),
  }
}

/** One story composed with its file's meta: what an MDX page's `<Canvas of>` shows. */
export const composeOne = (annotation: StoryAnnotation, meta: Meta): ComposedStory =>
  composeStory(
    annotation as Parameters<typeof composeStory>[0],
    meta as Parameters<typeof composeStory>[1]
  ) as unknown as ComposedStory

/** An MDX page, `guides/Theming.mdx`, compiled. */
export const loadMdx = async (file: string): Promise<MdxModule['default']> =>
  (await mdxFiles[STORIES + file]!()).default

/**
 * A loader, once per file: the promise React's `use` reads a page's content
 * from, settled as pages/chunks.ts's `once`, so a page whose content a page
 * change fetched first (`preloadDocsPage`) renders at once instead of
 * showing its spinner.
 */
const cached = <T>(load: (file: string) => Promise<T>) => {
  const loaders = new Map<string, () => Promise<T>>()
  return (file: string): Promise<T> => {
    let loader = loaders.get(file)
    if (!loader) loaders.set(file, (loader = once(() => load(file))))
    return loader()
  }
}

/** A component page's stories, loaded once. */
export const pageStories = cached(loadStories)

/** An MDX page, loaded once. */
export const pageMdx = cached(loadMdx)
