/**
 * "Try it": the page's main example as editable code, rendered live as you
 * type (react-live transpiles the JSX in the browser). Everything GreeseUI
 * exports, every icon, React's hooks and the docs' sample data are in scope,
 * so a visitor can change props, add components or wire up state.
 */
import * as React from 'react'
import { useEffect, useRef, useState, useSyncExternalStore, type JSX } from 'react'
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live'
import { themes } from 'prism-react-renderer'
import { Subheading, useOf } from '@storybook/addon-docs/blocks'
import * as Greese from '@greese-ui/react'
import * as Icons from '@greese-ui/icons'
import { art, countries } from '../stories/_shared/fixtures.tsx'
import { onSnippet, snippetFor } from './snippets.ts'

// react-live turns each key into a function parameter, so only plain
// identifiers: a namespace import's `default` would be a syntax error.
const scope = Object.fromEntries(
  Object.entries({ ...React, React, ...Greese, ...Icons, art, countries }).filter(
    ([name]) => name !== 'default' && /^[A-Za-z_$][\w$]*$/.test(name)
  )
)

// Several top-level elements are fine: they render as a fragment.
const transformCode = (code: string) => `<>\n${code}\n</>`

export const LiveCode = (): JSX.Element | null => {
  const story = useOf('story')
  const id = story.story.id
  const snippet = useSyncExternalStore(onSnippet, () => snippetFor(id))
  const [code, setCode] = useState<string>()
  const editor = useRef<HTMLDivElement>(null)
  // A new snippet (args changed in Controls, another page) resets the editor.
  useEffect(() => setCode(snippet), [snippet])
  // react-live renders a bare contenteditable <pre>: name it as a text box.
  useEffect(() => {
    const pre = editor.current?.querySelector('pre')
    if (!pre) return
    pre.setAttribute('role', 'textbox')
    pre.setAttribute('aria-multiline', 'true')
    pre.setAttribute('aria-label', 'Example code, editable')
  })
  if (!snippet || code === undefined) return null

  return (
    <>
      <Subheading>Try it</Subheading>
      <p>
        Edit the code; the result updates as you type. Every GreeseUI component and icon,
        and React&apos;s hooks, are in scope.
      </p>
      <LiveProvider
        code={code}
        scope={scope}
        transformCode={transformCode}
        theme={themes.vsDark}
        enableTypeScript
      >
        <div className="live-code">
          <div className="live-code-preview">
            <LivePreview />
          </div>
          <LiveError className="live-code-error" />
          <div className="live-code-editor" ref={editor}>
            <LiveEditor onChange={setCode} />
            {code !== snippet && (
              <Greese.Button
                size="sm"
                className="live-code-reset"
                onClick={() => setCode(snippet)}
              >
                Reset
              </Greese.Button>
            )}
          </div>
        </div>
      </LiveProvider>
      <style>{`
        .live-code { overflow: hidden; border: 1px solid var(--greese-color-border); border-radius: var(--greese-radius-md); }
        .live-code-preview { padding: var(--greese-space-5); background: var(--greese-color-canvas); color: var(--greese-color-fg); }
        .live-code-editor { position: relative; font: var(--greese-font-size-sm) / 1.6 var(--greese-font-mono); background: #1e1e1e; }
        .live-code-editor pre { margin: 0; padding: var(--greese-space-4) !important; min-block-size: 4rem; font-family: var(--greese-font-mono) !important; }
        .live-code-reset { position: absolute; inset-block-start: var(--greese-space-2); inset-inline-end: var(--greese-space-2); }
        .live-code-error { margin: 0; padding: var(--greese-space-3) var(--greese-space-4); white-space: pre-wrap; font: var(--greese-font-size-sm) / 1.5 var(--greese-font-mono); color: var(--greese-color-negative); background: color-mix(in oklab, var(--greese-color-negative) 10%, var(--greese-color-canvas)); }
      `}</style>
    </>
  )
}
