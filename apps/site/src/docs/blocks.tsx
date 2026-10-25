/**
 * Storybook's docs blocks, as the app renders them: `@storybook/addon-docs/blocks`
 * resolves here in the app's build (vite.config.ts), so the MDX guides and the
 * docs' shared components (ComponentStyles) work unchanged in both places.
 * Only the blocks the docs use: Meta, Canvas, Controls, Source, Subheading.
 */
import type { JSX, ReactNode } from 'react'
import { Heading } from '@greese/react'
import docgen from 'virtual:greese-docgen'
import { storyNameFromExport } from 'storybook/internal/csf'
import { ArgsTable } from './ArgsTable.tsx'
import { CodeBlock } from './CodeBlock.tsx'
import {
  composeOne,
  type ComposedStory,
  type Meta as MetaAnnotation,
  type StoryAnnotation,
} from './load.ts'
import { StoryCanvas } from './StoryCanvas.tsx'
import { componentName } from './toJsx.ts'

type StoryModule = Record<string, unknown> & { default: MetaAnnotation }

/** Each story's file: its meta and export name, registered by `<Meta of>`. */
const owners = new WeakMap<object, { meta: MetaAnnotation; key: string }>()
const composed = new WeakMap<object, ComposedStory>()

/**
 * `<Meta of={Stories} />` heads an MDX page that documents a story file; it
 * draws nothing, and lets the page's `<Canvas of>` find each story's meta.
 * (Run while rendering, before the canvases after it; registering is idempotent.)
 */
export const Meta = ({ of }: { of?: StoryModule; title?: string }): null => {
  if (of)
    for (const [key, value] of Object.entries(of))
      if (key !== 'default' && value && typeof value === 'object')
        owners.set(value, { meta: of.default, key })
  return null
}

const resolve = (annotation: StoryAnnotation) => {
  const owner = owners.get(annotation)
  const meta = owner?.meta ?? {}
  let story = composed.get(annotation)
  if (!story) composed.set(annotation, (story = composeOne(annotation, meta)))
  const name = annotation.name ?? (owner ? storyNameFromExport(owner.key) : 'Example')
  return { story, meta, name }
}

/** `<Canvas of={Stories.Playground} />`: the story, on the page. */
export const Canvas = ({ of }: { of: StoryAnnotation }): JSX.Element => {
  const { story, meta, name } = resolve(of)
  return <StoryCanvas story={story} meta={meta} annotation={of} label={name} />
}

/** `<Controls of={Stories.Playground} />`: its component's props, driving it. */
export const Controls = ({ of }: { of: StoryAnnotation }): JSX.Element | null => {
  const { story, meta } = resolve(of)
  const name = componentName(meta.component)
  return <ArgsTable docs={docgen[name]} story={story} caption={`${name} props`} />
}

/** `<Source code language />`: a block of code. */
export const Source = ({
  code = '',
  language,
}: {
  code?: string
  language?: string
  dark?: boolean
}): JSX.Element => <CodeBlock code={code} language={language} />

/** `<Subheading>`: a heading under a section's. */
export const Subheading = ({ children }: { children?: ReactNode }): JSX.Element => (
  <Heading level={4} variant="h5" className="docs-subheading">
    {children}
  </Heading>
)
