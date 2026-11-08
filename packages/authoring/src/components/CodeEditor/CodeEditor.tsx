'use client'
import {
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { cx, Textarea } from '@greese/react'
import {
  highlightCode,
  splitLines,
  splitTokens,
  type CodeLanguage,
  type CodeLine,
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

/** The line, from 0, that a character offset is on. */
const lineAt = (text: string, offset: number): number => {
  let line = 0
  for (let i = text.indexOf('\n'); i !== -1 && i < offset; i = text.indexOf('\n', i + 1))
    line++
  return line
}

/** A character offset as a line and a column, both from 1. */
const lineAndColumn = (text: string, offset: number): [number, number] => [
  lineAt(text, offset) + 1,
  // `lastIndexOf` reads a negative start as 0, which could find a newline at 0.
  offset === 0 ? 1 : offset - text.lastIndexOf('\n', offset - 1),
]

/** `from` alone when it's `to`, else `from–to`. */
const span = (from: number, to: number): string =>
  from === to ? String(from) : `${from}–${to}`

/** Each language's name in the status line. */
const LANGUAGE_NAMES: Record<CodeLanguage, string> = {
  css: 'CSS',
  scss: 'SCSS',
  js: 'JavaScript',
  ts: 'TypeScript',
  xml: 'XML',
}

const count = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

/**
 * The status line's parts: where the caret is, or what the selection spans
 * and how much it holds; then the tab size and the language.
 */
const caretStatus = (
  text: string,
  start: number,
  end: number,
  tabSize: number,
  language: CodeLanguage
): string[] => {
  const [fromLine, fromColumn] = lineAndColumn(text, start)
  const [toLine, toColumn] = lineAndColumn(text, end)
  const parts = [`Ln ${span(fromLine, toLine)}, Col ${span(fromColumn, toColumn)}`]
  if (end > start)
    parts.push(
      `${count(toLine - fromLine + 1, 'line')}, ${count(end - start, 'character')} selected`
    )
  parts.push(`Spaces: ${tabSize}`, LANGUAGE_NAMES[language])
  return parts
}

/**
 * One line of the coloured layer. Its number is the stylesheet's (a counter),
 * so the layer's text stays the code's. Memoised: moving the caret re-renders
 * only the lines it leaves and enters.
 */
const Line = memo(function Line({
  parts: [before, inside, after],
  current,
  marked,
}: {
  parts: CodeLine
  current: boolean
  marked: boolean
}) {
  return (
    <span
      className="greese-CodeEditor-line"
      data-current={current || undefined}
      data-mark={marked || undefined}
    >
      {colour(before)}
      {inside.length > 0 && (
        <mark className="greese-CodeEditor-highlight">{colour(inside)}</mark>
      )}
      {colour(after)}
      {'\n'}
    </span>
  )
})

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
  /** Wraps long lines at the box's edge instead of scrolling sideways. */
  wrap?: boolean
  /** Numbers the lines in a gutter that stays put as the code scrolls sideways. */
  lineNumbers?: boolean
  /**
   * Adds a status line under the code: the caret's line and column, or the
   * lines and columns a selection spans with how many lines and characters
   * it holds; then the tab size and the language.
   */
  status?: boolean
  /** How many spaces a tab is wide. @default 2 */
  tabSize?: number
  /** Classes for the box. */
  className?: string
}

/**
 * A code box with syntax highlighting and no dependency: the text is drawn
 * twice, coloured underneath (`highlightCode`), and as a transparent textarea
 * on top, which is what you type in, select and tab to. The two share one
 * font, padding and scroll position. It's greese's `Textarea`, so a `Field`
 * labels and describes it as usual. The caret's line is lit while it has
 * focus; `lineNumbers` numbers the lines, and `status` says where the caret
 * is. `highlight` lights a span, and
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
  wrap = false,
  lineNumbers = false,
  status = false,
  tabSize = 2,
  className,
}: CodeEditorProps): JSX.Element => {
  const layer = useRef<HTMLPreElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  // The selection as the box last reported it: its ends, and which one moves.
  const [caret, setCaret] = useState({ start: 0, end: 0, backward: false })
  const tokens = useMemo(() => highlightCode(value, language), [value, language])
  const highlightStart = highlight?.start ?? 0
  const highlightEnd = highlight?.end ?? 0
  const lines = useMemo(
    () =>
      splitLines(
        highlightEnd > highlightStart
          ? splitTokens(tokens, { start: highlightStart, end: highlightEnd })
          : [tokens]
      ),
    [tokens, highlightStart, highlightEnd]
  )

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
    const line = lineAt(box.value, selectionStart)
    setCaret({ start: selectionStart, end: selectionEnd, backward: false })
    const lineHeight = parseFloat(getComputedStyle(box).lineHeight) || 18
    const top = line * lineHeight
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - lineHeight) {
      box.scrollTop = Math.max(0, top - box.clientHeight / 3)
    }
    if (layer.current) layer.current.scrollTop = box.scrollTop
  }, [selectionStart, selectionEnd])

  const followCaret = (box: HTMLTextAreaElement) =>
    setCaret({
      start: box.selectionStart,
      end: box.selectionEnd,
      backward: box.selectionDirection === 'backward',
    })
  // The code may have changed since the selection was reported: clamp to it.
  const caretStart = Math.min(caret.start, value.length)
  const caretEnd = Math.min(caret.end, value.length)
  // The caret's line: where the selection's moving end is.
  const caretLine = lineAt(value, caret.backward ? caretStart : caretEnd)

  const reportSelection = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    const { selectionStart: start, selectionEnd: end } = event.currentTarget
    followCaret(event.currentTarget)
    onSelectionChange?.({ start, end })
  }

  return (
    <div
      className={cx('greese-CodeEditor', className)}
      data-invalid={invalid || undefined}
      data-wrap={wrap || undefined}
      data-line-numbers={lineNumbers || undefined}
      data-status={status || undefined}
      style={
        {
          // The gutter fits the last line's number, two digits at least.
          '--greese-codeeditor-digits': Math.max(2, String(lines.length).length),
          '--greese-codeeditor-tab-size': tabSize,
        } as CSSProperties
      }
    >
      <div className="greese-CodeEditor-body">
        <pre ref={layer} className="greese-CodeEditor-layer" aria-hidden="true">
          <code>
            {lines.map((parts, i) => (
              <Line
                key={i}
                parts={parts}
                current={i === caretLine}
                marked={markLine === i + 1}
              />
            ))}
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
          wrap={wrap ? 'soft' : 'off'}
          data-language={language}
          onChange={(event) => onChange?.(event.currentTarget.value)}
          onSelect={reportSelection}
          onFocus={(event) => followCaret(event.currentTarget)}
          onScroll={(event) => {
            if (!layer.current) return
            const { scrollTop, scrollLeft } = event.currentTarget
            layer.current.scrollTop = scrollTop
            layer.current.scrollLeft = scrollLeft
            // The gutter moves back by as much, so the numbers stay put.
            layer.current.style.setProperty(
              '--greese-codeeditor-scroll',
              `${scrollLeft}px`
            )
          }}
        />
      </div>
      {status && (
        <div className="greese-CodeEditor-status">
          {caretStatus(value, caretStart, caretEnd, tabSize, language).map((part) => (
            <span key={part}>{part}</span>
          ))}
        </div>
      )}
    </div>
  )
}
