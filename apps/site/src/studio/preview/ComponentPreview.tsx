import { Component, useEffect, useState, type JSX, type ReactNode } from 'react'
import { Card, Spinner, Stack, Text } from '@greese/react'
import { Anatomy } from '../../../../docs/stories/_shared/Anatomy.tsx'
import { familyOf } from '../family.ts'
import { hasStories, loadStories, type LoadedStories } from './stories.ts'

/** One broken story shows a message instead of taking the preview down. */
class StoryBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  override state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  override render() {
    return this.state.error ? (
      <Text variant="p3" tone="negative">
        This story didn&apos;t render here: {this.state.error.message}
      </Text>
    ) : (
      this.props.children
    )
  }
}

/**
 * The featured component: every story from its docs page, live, with the
 * theme being edited applied. It follows the Components tab's selection.
 */
export const ComponentPreview = ({ block }: { block: string }): JSX.Element => {
  const [loaded, setLoaded] = useState<LoadedStories | null>()
  const [family, setFamily] = useState<string[]>([block])

  useEffect(() => {
    let current = true
    setLoaded(undefined)
    setFamily([block])
    void loadStories(block).then((result) => {
      if (current) setLoaded(result ?? null)
    })
    void familyOf(block).then((blocks) => current && setFamily(blocks))
    return () => {
      current = false
    }
  }, [block])

  return (
    <section aria-label={`${block} preview`} className="studio-component-preview">
      <Stack gap={4}>
        {!hasStories(block) && (
          <Text variant="p3" tone="muted">
            {block} has no docs page of its own; it&apos;s styled through the components
            that use it, in the theme preview below.
          </Text>
        )}
        {loaded === undefined && hasStories(block) && <Spinner label="Loading stories" />}
        {loaded && loaded.stories[0] && (
          <Card padding={4}>
            <Stack gap={3}>
              <Text variant="h3" weight="semibold" tone="muted">
                Anatomy: {block}
              </Text>
              <Text variant="caption" tone="muted">
                Every element of {block}, and of what it contains and is built on, with
                the classes it carries. Edit them under Styles in the Components tab.
              </Text>
              <div className="studio-story" data-layout="padded">
                <StoryBoundary>
                  <Anatomy name={block} family={family}>
                    {(() => {
                      const Story = loaded.stories[0]![1]
                      return <Story />
                    })()}
                  </Anatomy>
                </StoryBoundary>
              </div>
            </Stack>
          </Card>
        )}
        {loaded && (
          <Stack gap={4}>
            {loaded.stories.map(([name, Story]) => (
              <Card key={name} padding={4}>
                <Stack gap={3}>
                  <Text variant="h3" weight="semibold" tone="muted">
                    {name}
                  </Text>
                  {/* A block root, as Storybook's #storybook-root is: a story
                      rendered straight into the flex Stack would have its
                      inline components (Chip, Badge) stretched full width. */}
                  <div
                    className="studio-story"
                    data-layout={Story.parameters?.layout ?? 'padded'}
                  >
                    <StoryBoundary>
                      <Story />
                    </StoryBoundary>
                  </div>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </section>
  )
}
