/**
 * A component's page, made from its story file as Storybook's generated docs
 * page is (Title, Description, Primary, Controls, Try it, Stories, Styling),
 * in the app: every example renders in the page, in the theme being worn.
 */
import { use, type JSX } from 'react'
import { Heading, Stack, Text } from '@greese/react'
import docgen from 'virtual:greese-docgen'
import {
  ComponentStyles,
  hasStyles,
} from '../../../docs/stories/_shared/ComponentStyles.tsx'
import { ArgsTable } from './ArgsTable.tsx'
import { LiveCode } from './LiveCode.tsx'
import { loadStories, type LoadedStories } from './load.ts'
import { Markdown } from './Markdown.tsx'
import { pageName, type DocsPage } from './pages.ts'
import { slug } from './slug.ts'
import { StoryCanvas } from './StoryCanvas.tsx'
import { componentName } from './toJsx.ts'

const loaded = new Map<string, Promise<LoadedStories>>()
const stories = (file: string) => {
  let promise = loaded.get(file)
  if (!promise) loaded.set(file, (promise = loadStories(file)))
  return promise
}

/** A section's heading, with the id the page's contents link to. */
const Section = ({ children }: { children: string }): JSX.Element => (
  <Heading level={2} variant="h3" id={slug(children)} className="docs-heading">
    {children}
    <a
      href={`#${slug(children)}`}
      className="docs-heading-anchor"
      aria-label="Link to this section"
    >
      #
    </a>
  </Heading>
)

export const ComponentPage = ({ page }: { page: DocsPage }): JSX.Element => {
  const { meta, description, stories: all } = use(stories(page.file))
  // The component's name, as the library exports it; a story file of
  // examples (no component) goes by its title.
  const named = meta.component ? componentName(meta.component) : undefined
  const name = named && docgen[named] ? named : pageName(page)
  const docs = docgen[name]
  const [primary, ...rest] = all
  const subcomponents = Object.keys(meta.subcomponents ?? {})

  return (
    <>
      <Stack gap={3} className="docs-intro">
        <Heading level={1} variant="h1">
          {pageName(page)}
        </Heading>
        {/* As Storybook: the story file's own description wins over the component's. */}
        {(description ?? docs?.description) && (
          <div className="docs-prose docs-lead">
            <Markdown>{description ?? docs?.description ?? ''}</Markdown>
          </div>
        )}
      </Stack>

      {primary && (
        <StoryCanvas
          story={primary.Story}
          meta={meta}
          annotation={primary.annotation}
          label={primary.name}
        />
      )}

      {(docs || primary?.Story.argTypes) && (
        <>
          <Section>Props</Section>
          <ArgsTable docs={docs} story={primary?.Story} caption={`${name} props`} />
          {subcomponents.map((sub) => (
            <Stack key={sub} gap={2}>
              <Heading level={3} variant="h5" id={slug(`${sub} props`)}>
                {sub}
              </Heading>
              <ArgsTable docs={docgen[sub]} caption={`${sub} props`} />
            </Stack>
          ))}
        </>
      )}

      {primary && meta.component && meta.parameters?.tryIt !== false && (
        <>
          <Section>Try it</Section>
          <Text tone="muted" className="docs-measure">
            Edit the code; the result updates as you type. Every GreeseUI component and
            icon, and React&apos;s hooks, are in scope.
          </Text>
          <LiveCode story={primary.Story} meta={meta} annotation={primary.annotation} />
        </>
      )}

      {rest.length > 0 && (
        <>
          <Section>Examples</Section>
          {rest.map((story) => (
            <Stack key={story.key} gap={3}>
              <Heading
                level={3}
                variant="h4"
                id={slug(story.name)}
                className="docs-heading"
              >
                {story.name}
              </Heading>
              {story.description && (
                <div className="docs-prose">
                  <Markdown>{story.description}</Markdown>
                </div>
              )}
              <StoryCanvas
                story={story.Story}
                meta={meta}
                annotation={story.annotation}
                label={story.name}
              />
            </Stack>
          ))}
        </>
      )}

      {hasStyles(name) && (
        <>
          <Section>Styling</Section>
          <div className="docs-prose">
            <ComponentStyles name={name} subcomponents={subcomponents} />
          </div>
        </>
      )}
    </>
  )
}
