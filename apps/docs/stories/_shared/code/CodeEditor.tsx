import { useMemo, useRef, type JSX } from 'react'
import { Textarea } from '@greese/react'
import { highlight, type Language } from './highlight.ts'
import './CodeEditor.scss'

const colour = (tokens: ReturnType<typeof highlight>) =>
  tokens.map((token, i) =>
    token.kind ? (
      <span key={i} className={`tok-${token.kind}`}>
        {token.text}
      </span>
    ) : (
      token.text
    )
  )

/**
 * Read-only code, coloured as the code box colours it: the content of a
 * `<Code block className="studio-highlighted">`.
 */
export const Highlighted = ({
  value,
  language,
}: {
  value: string
  language: Language
}): JSX.Element => {
  const tokens = useMemo(() => highlight(value, language), [value, language])
  return <>{colour(tokens)}</>
}

/**
 * A code box with syntax highlighting, and no dependency: the text is drawn
 * twice, coloured underneath (a `pre` of tokens, `highlight()`), and as a
 * transparent textarea on top, which is what you type in, select and tab to. The
 * two share one font, padding and scroll position. It is a library
 * `Textarea`, so a surrounding `Field` labels and describes it as usual.
 * The studio edits themes in it; the docs show files in it, read-only. It
 * colours CSS, SCSS, JavaScript and TypeScript.
 */
export const CodeEditor = ({
  value,
  onChange,
  language,
  rows = 8,
  invalid,
  disabled,
  readOnly,
  markLine,
  'aria-label': label,
}: {
  value: string
  onChange?: (value: string) => void
  /** How to colour the text: `css`, `scss`, `js` (and JSON) or `ts`. */
  language: Language
  rows?: number
  invalid?: boolean
  disabled?: boolean
  readOnly?: boolean
  /** A line to mark (from 1), such as where a compile error is. */
  markLine?: number
  'aria-label'?: string
}): JSX.Element => {
  const layer = useRef<HTMLPreElement>(null)
  const tokens = useMemo(() => highlight(value, language), [value, language])
  return (
    // `sb-unstyled`: Storybook's docs style every div and `code` they hold,
    // and the layer must keep exactly the textarea's font and padding.
    <div className="code-editor sb-unstyled" data-invalid={invalid || undefined}>
      <pre ref={layer} className="code-editor-layer" aria-hidden="true">
        {markLine !== undefined && (
          <span
            className="code-editor-mark"
            style={{ insetBlockStart: `calc(var(--greese-space-3) + ${markLine - 1}lh)` }}
          />
        )}
        <code>
          {colour(tokens)}
          {/* A last empty line keeps the layer as tall as the textarea. */}
          {'\n'}
        </code>
      </pre>
      <Textarea
        className="code-editor-input"
        rows={rows}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={label}
        aria-invalid={invalid || undefined}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        data-language={language}
        onChange={(event) => onChange?.(event.currentTarget.value)}
        onScroll={(event) => {
          if (!layer.current) return
          layer.current.scrollTop = event.currentTarget.scrollTop
          layer.current.scrollLeft = event.currentTarget.scrollLeft
        }}
      />
    </div>
  )
}
