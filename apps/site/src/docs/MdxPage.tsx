/**
 * An MDX page (a guide, or a page that documents a story file) in the app:
 * its headings get the ids its `#links` and the search point at, its code
 * blocks are highlighted, its links stay in the app, and its Storybook blocks
 * render as the app's own (blocks.tsx).
 */
import {
  Children,
  isValidElement,
  use,
  type ComponentProps,
  type JSX,
  type ReactNode,
} from 'react'
import { Code, Heading } from '@greese/react'
import type { MDXComponents } from 'mdx/types'
import { CodeBlock } from './CodeBlock.tsx'
import { DocsLink } from './DocsLink.tsx'
import { loadMdx } from './load.ts'
import type { DocsPage } from './pages.ts'
import { slug } from './slug.ts'

/** A node's text: what a heading reads as, for its id. */
export const textOf = (node: ReactNode): string =>
  Children.toArray(node)
    .map((child) =>
      typeof child === 'string' || typeof child === 'number'
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textOf(child.props.children)
          : ''
    )
    .join('')

const heading = (level: 1 | 2 | 3 | 4) => {
  const MdxHeading = ({ children }: { children?: ReactNode }): JSX.Element => {
    // Ids are the heading's slug: no guide repeats a heading
    // (docsIndex.test.ts checks), so none needs GitHub's `-1`.
    const id = level === 1 ? undefined : slug(textOf(children))
    return (
      <Heading
        level={level}
        variant={(['h1', 'h3', 'h4', 'h5'] as const)[level - 1]}
        id={id}
        className="docs-heading"
      >
        {children}
        {id && (
          <a
            href={`#${id}`}
            className="docs-heading-anchor"
            aria-label="Link to this section"
          >
            #
          </a>
        )}
      </Heading>
    )
  }
  MdxHeading.displayName = `MdxH${level}`
  return MdxHeading
}

/** A fenced block: MDX's `<pre><code className="language-tsx">`. */
const Pre = ({ children }: { children?: ReactNode }): JSX.Element => {
  const code = Children.only(children)
  const inner: { className?: string; children?: ReactNode } = isValidElement<{
    className?: string
    children?: ReactNode
  }>(code)
    ? code.props
    : { children: code }
  const language = /language-(\w+)/.exec(inner.className ?? '')?.[1]
  return <CodeBlock code={textOf(inner.children)} language={language ?? 'text'} />
}

const Table = (props: ComponentProps<'table'>): JSX.Element => (
  <div className="docs-table-scroll" role="region" aria-label="Table" tabIndex={0}>
    <table {...props} />
  </div>
)

export const MDX_COMPONENTS: MDXComponents = {
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  a: ({ href, children }) => <DocsLink href={href}>{children}</DocsLink>,
  pre: Pre,
  code: ({ children }) => <Code>{children}</Code>,
  table: Table,
}

const loaded = new Map<string, ReturnType<typeof loadMdx>>()
const mdx = (file: string) => {
  let promise = loaded.get(file)
  if (!promise) loaded.set(file, (promise = loadMdx(file)))
  return promise
}

export const MdxPage = ({ page }: { page: DocsPage }): JSX.Element => {
  const Content = use(mdx(page.file))
  return (
    <div className="docs-prose">
      <Content components={MDX_COMPONENTS} />
    </div>
  )
}
