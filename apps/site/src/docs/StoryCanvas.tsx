/**
 * One story on a docs page: rendered in the page itself (it wears the page's
 * theme, scheme and motion), framed by its `layout`, with its code a click
 * away. Storybook's Canvas block, built from greese ui's own components.
 */
import { Component, useState, type JSX, type ReactNode } from 'react'
import { Button, Stack, Text } from '@greese/react'
import { useShell } from '../shell.ts'
import { useStoryArgs } from './args.ts'
import { CodeBlock } from './CodeBlock.tsx'
import type { Args, ComposedStory, Meta, StoryAnnotation } from './load.ts'
import { storySnippet } from './toJsx.ts'

/** What a story's render is called with, as Storybook passes it in docs. */
export const storyContext = (story: ComposedStory, meta: Meta, args: Args) => ({
  args,
  argTypes: story.argTypes,
  parameters: story.parameters,
  component: meta.component,
  id: story.id,
  title: meta.title,
  globals: {},
  viewMode: 'docs',
})

/** A story that throws shows why, instead of taking the page with it. */
export class Boundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <Text tone="negative" role="alert">
        This example failed to render: {this.state.error.message}
      </Text>
    )
  }
}

/** The story's code, made when it's asked for: its render with the args shown. */
const Source = ({
  story,
  meta,
  annotation,
  args,
}: {
  story: ComposedStory
  meta: Meta
  annotation: StoryAnnotation
  args: Args
}): JSX.Element => (
  <CodeBlock
    code={
      // A story that keeps state shows its source: its output can't show the
      // hooks and handlers it needs (apps/docs/.storybook/storySource.ts).
      annotation.parameters?.docs?.source?.code ??
      storySnippet(
        annotation.render ?? meta.render,
        meta.component,
        args,
        storyContext(story, meta, args),
        [...(annotation.decorators ?? []), ...(meta.decorators ?? [])]
      )
    }
  />
)

export interface StoryCanvasProps {
  story: ComposedStory
  meta: Meta
  annotation: StoryAnnotation
  /** Names the example for assistive tech: the story's name. */
  label: string
}

export const StoryCanvas = ({
  story: Story,
  meta,
  annotation,
  label,
}: StoryCanvasProps): JSX.Element => {
  const { args } = useStoryArgs(Story)
  const [code, setCode] = useState(false)
  // "Replay motion" in the header remounts examples, so entrances play again.
  const { replay } = useShell()
  const layout = Story.parameters.layout ?? 'padded'
  return (
    <Stack gap={0} className="docs-story">
      <div
        role="group"
        aria-label={`Example: ${label}`}
        className={`docs-canvas docs-canvas--${layout}`}
      >
        <Boundary key={replay}>
          <Story {...args} />
        </Boundary>
      </div>
      <div className="docs-story-bar">
        <Button
          size="sm"
          variant="ghost"
          tone="neutral"
          aria-expanded={code}
          onClick={() => setCode((open) => !open)}
        >
          {code ? 'Hide code' : 'Show code'}
        </Button>
      </div>
      {code && (
        <Boundary>
          <Source story={Story} meta={meta} annotation={annotation} args={args} />
        </Boundary>
      )}
    </Stack>
  )
}
