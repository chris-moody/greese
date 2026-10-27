/**
 * "Try it": a page's main example as editable code, rendered live as you type
 * (react-live transpiles the JSX in the browser). Everything greese ui exports,
 * every icon, React's hooks, the docs' sample data and the story file's own
 * helpers (`parameters.tryIt.scope`) are in scope, so a
 * visitor can change props, add components or wire up state. It starts from
 * the main story with the args its controls set.
 */
import * as React from 'react'
import { useEffect, useRef, useState, type JSX } from 'react'
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live'
import * as Greese from '@greese/react'
import * as Icons from '@greese/icons'
import { art, countries } from '../../../docs/stories/_shared/fixtures.tsx'
import { useStoryArgs } from './args.ts'
import type { ComposedStory, Meta, StoryAnnotation } from './load.ts'
import { storyContext } from './StoryCanvas.tsx'
import { storyScope, storySnippet } from './toJsx.ts'

// react-live turns each key into a function parameter, so only plain
// identifiers: a namespace import's `default` would be a syntax error.
const scope = Object.fromEntries(
  Object.entries({ ...React, React, ...Greese, ...Icons, art, countries }).filter(
    ([name]) => name !== 'default' && /^[A-Za-z_$][\w$]*$/.test(name)
  )
)

// Several top-level elements are fine: they render as a fragment.
const transformCode = (code: string) => `<>\n${code}\n</>`

// The editor's colours come from the page's code palette (`_code.scss`).
const THEME = { plain: {}, styles: [] }

export const LiveCode = ({
  story,
  meta,
  annotation,
}: {
  story: ComposedStory
  meta: Meta
  annotation: StoryAnnotation
}): JSX.Element | null => {
  const { args } = useStoryArgs(story)
  const helpers = storyScope(meta.parameters)
  const snippet = storySnippet(
    annotation.render ?? meta.render,
    meta.component,
    args,
    storyContext(story, meta, args),
    [...(annotation.decorators ?? []), ...(meta.decorators ?? [])]
  )
  const [code, setCode] = useState(snippet)
  const editor = useRef<HTMLDivElement>(null)
  // A new snippet (a control changed it) resets the editor.
  useEffect(() => setCode(snippet), [snippet])
  // react-live renders a bare contenteditable <pre>: name it as a text box.
  useEffect(() => {
    const pre = editor.current?.querySelector('pre')
    if (!pre) return
    pre.setAttribute('role', 'textbox')
    pre.setAttribute('aria-multiline', 'true')
    pre.setAttribute('aria-label', 'Example code, editable')
  })
  if (!snippet) return null

  return (
    <LiveProvider
      code={code}
      scope={{ ...scope, ...helpers }}
      transformCode={transformCode}
      theme={THEME}
      enableTypeScript
    >
      <div className="docs-live">
        <div className="docs-live-preview">
          <LivePreview />
        </div>
        <LiveError className="docs-live-error" />
        <div className="docs-live-editor docs-code-block" ref={editor}>
          <LiveEditor onChange={setCode} />
          {code !== snippet && (
            <Greese.Button
              size="sm"
              className="docs-live-reset"
              onClick={() => setCode(snippet)}
            >
              Reset
            </Greese.Button>
          )}
        </div>
      </div>
    </LiveProvider>
  )
}
