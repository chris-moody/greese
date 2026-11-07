'use client'
import {
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type JSX,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { cx, Textarea } from '@greese/react'
import {
  highlightCode,
  splitTokens,
  type CodeLanguage,
  type CodeRange,
  type CodeToken,
} from '../../core/code/highlight.ts'

const colour = (tokens: readonly CodeToken[]): ReactNode[] =>
  tokens.map((token, i) =>
    token.kind ? (
      <span key={i} className={`greese-CodeToken--${token.kind}`}>
        {token.text}
      </span>
    ) : (
      token.text
    )
  )

export interface HighlightedProps {
  /** The code. */
  value: string
  /** How to colour it. */
  language: CodeLanguage
}

/**
 * Read-only code, coloured as `CodeEditor` colours it: the content of a
 * `<code>` or `<pre>` whose stylesheet includes the code palette.
 *
 * ```tsx
 * <pre className="greese-CodeEditor-static"><Highlighted value={svg} language="xml" /></pre>
 * ```
 */
export const Highlighted = ({ value, language }: HighlightedProps): JSX.Element => {
  const tokens = useMemo(() => highlightCode(value, language), [value, language])
  return <>{colour(tokens)}</>
}

export interface CodeEditorProps {
  /** The code. */
  value: string
  /** Called with the new code as it's typed. Without it, the box is read-only. */
  onChange?: (value: string) => void
  /** How to colour it: `css`, `scss`, `js` (and JSON), `ts` or `xml` (and SVG). */
  language: CodeLanguage
  /** The box's height, in lines; it scrolls past that. @default 8 */
  rows?: number
  /** Marks the code as having an error: a negative border, and `aria-invalid`. */
  invalid?: boolean
  /** Stops editing and dims it. */
  disabled?: boolean
  /** Lets the code be selected and copied, not changed. Without `onChange` it always is. */
  readOnly?: boolean
  /** A line to mark, from 1, such as where a compile error is. */
  markLine?: number
  /** A span to light behind the text, by character offsets: the code for what's selected on a canvas. */
  highlight?: CodeRange
  /**
   * The text selection, when you drive it: set it, and the box selects that
   * span and scrolls it into view, without taking focus.
   */
  selection?: CodeRange
  /** Called with the selection as the reader moves it: for a canvas to follow the code. */
  onSelectionChange?: (selection: CodeRange) => void
  /** The box's accessible name, when no `Field` labels it. */
  'aria-label'?: string
  /** Classes for the box. */
  className?: string
}

/**
 * A code box with syntax highlighting and no dependency: the text is drawn
 * twice, coloured underneath (`highlightCode`), and as a transparent textarea
 * on top, which is what you type in, select and tab to. The two share one
 * font, padding and scroll position. It's greese's `Textarea`, so a `Field`
 * labels and describes it as usual. `highlight` lights a span, and
 * `selection` and `onSelectionChange` keep the code and a canvas in step.
 *
 * ```tsx
 * <CodeEditor aria-label="SVG" language="xml" value={svg} onChange={setSvg} highlight={range} />
 * ```
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
  highlight,
  selection,
  onSelectionChange,
  'aria-label': label,
  className,
}: CodeEditorProps): JSX.Element => {
  const layer = useRef<HTMLPreElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const tokens = useMemo(() => highlightCode(value, language), [value, language])

  // Select the span the owner asked for and bring it into view. Only when the
  // span itself changes, and differs from what's selected: typing changes the
  // value, and a stale span mustn't pull the caret back.
  const selectionStart = selection?.start
  const selectionEnd = selection?.end
  useLayoutEffect(() => {
    const box = input.current
    if (!box || selectionStart === undefined || selectionEnd === undefined) return
    if (box.selectionStart === selectionStart && box.selectionEnd === selectionEnd) return
    box.setSelectionRange(selectionStart, selectionEnd)
    const line = box.value.slice(0, selectionStart).split('\n').length - 1
    const lineHeight = parseFloat(getComputedStyle(box).lineHeight) || 18
    const top = line * lineHeight
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - lineHeight) {
      box.scrollTop = Math.max(0, top - box.clientHeight / 3)
    }
    if (layer.current) layer.current.scrollTop = box.scrollTop
  }, [selectionStart, selectionEnd])

  const reportSelection = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    const { selectionStart: start, selectionEnd: end } = event.currentTarget
    onSelectionChange?.({ start, end })
  }

  const lit = highlight && highlight.end > highlight.start
  const [before, inside, after] = lit
    ? splitTokens(tokens, highlight)
    : [tokens, [] as CodeToken[], [] as CodeToken[]]

  return (
    <div
      className={cx('greese-CodeEditor', className)}
      data-invalid={invalid || undefined}
    >
      <pre ref={layer} className="greese-CodeEditor-layer" aria-hidden="true">
        {markLine !== undefined && (
          <span
            className="greese-CodeEditor-mark"
            style={{ '--greese-codeeditor-line': markLine - 1 } as CSSProperties}
          />
        )}
        <code>
          {colour(before)}
          {lit && <mark className="greese-CodeEditor-highlight">{colour(inside)}</mark>}
          {colour(after)}
          {/* A last empty line keeps the layer as tall as the textarea. */}
          {'\n'}
        </code>
      </pre>
      <Textarea
        ref={input}
        className="greese-CodeEditor-input"
        rows={rows}
        value={value}
        disabled={disabled}
        // No onChange is nothing to type into: a controlled box would undo each key.
        readOnly={readOnly || !onChange}
        aria-label={label}
        // Textarea sets `aria-invalid` from this; one passed directly is
        // overwritten, so the docs' copy never announced an error.
        invalid={invalid}
        // The box keeps its rows and scrolls, with the layer following.
        autosize={false}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        data-language={language}
        onChange={(event) => onChange?.(event.currentTarget.value)}
        onSelect={onSelectionChange && reportSelection}
        onScroll={(event) => {
          if (!layer.current) return
          layer.current.scrollTop = event.currentTarget.scrollTop
          layer.current.scrollLeft = event.currentTarget.scrollLeft
        }}
      />
    </div>
  )
}
