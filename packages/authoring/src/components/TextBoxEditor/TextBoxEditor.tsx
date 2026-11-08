'use client'
import { useLayoutEffect, useRef, type CSSProperties, type JSX } from 'react'
import { cx } from '@greese/react'
import { caretRangeAt } from '../../core/stage/caret.ts'
import type { Rect } from '../../core/stage/renderObject.types.ts'

export interface TextBoxEditorProps {
  /** The text it opens with. From then on the text is the editor's own; `onValueChange` reports it. */
  defaultValue: string
  /** The box, in pixels from the top left of the positioned element it's in: over the text on the stage. */
  rect: Rect
  /** Called with the text as it's typed. */
  onValueChange?: (value: string) => void
  /** Called with the text when editing ends: Escape, or focus leaving the box. */
  onDone?: (value: string) => void
  /**
   * A point in client coordinates to put the caret at, such as the click
   * that opened the editor. Without it, or off the text, the caret goes at
   * the end.
   */
  caretPoint?: { x: number; y: number }
  /** The text's font and colour, sized to the stage's zoom, so the words sit where the drawing has them. */
  style?: CSSProperties
  /** The box's accessible name. */
  'aria-label'?: string
  /** Classes for the box. */
  className?: string
}

/**
 * Edits a text box's words where they're drawn: a plain-text editable box
 * laid over the text on a stage, with the caret where the click was. The
 * stage hides its own copy of the text while it's open, and writes the
 * words back from `onValueChange` or `onDone`.
 *
 * ```tsx
 * <TextBoxEditor rect={screenBox} defaultValue={text} caretPoint={click} onDone={save} />
 * ```
 */
/** The words as typed: `innerText` reads a browser's line breaks (`<br>` too) as newlines. */
const wordsOf = (el: HTMLElement): string => el.innerText ?? el.textContent ?? ''

export const TextBoxEditor = ({
  defaultValue,
  rect,
  onValueChange,
  onDone,
  caretPoint,
  style,
  'aria-label': label = 'Text',
  className,
}: TextBoxEditorProps): JSX.Element => {
  const box = useRef<HTMLDivElement>(null)
  // Read once: later renders don't move the caret or reset the text.
  const opening = useRef({ defaultValue, caretPoint })
  const done = useRef(false)

  useLayoutEffect(() => {
    const root = box.current
    if (!root) return
    root.textContent = opening.current.defaultValue
    root.focus({ preventScroll: true })
    const point = opening.current.caretPoint
    let range = point ? caretRangeAt(root, point) : null
    if (!range) {
      range = document.createRange()
      range.selectNodeContents(root)
      range.collapse(false)
    }
    const selection = root.ownerDocument.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [])

  const finish = () => {
    if (done.current || !box.current) return
    done.current = true
    onDone?.(wordsOf(box.current))
  }

  return (
    <div
      ref={box}
      className={cx('greese-TextBoxEditor', className)}
      role="textbox"
      aria-multiline="true"
      aria-label={label}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      style={{
        insetInlineStart: rect.x,
        insetBlockStart: rect.y,
        inlineSize: rect.width,
        minBlockSize: rect.height,
        ...style,
      }}
      // The stage under it mustn't start a gesture of its own.
      onPointerDown={(event) => event.stopPropagation()}
      onInput={(event) => onValueChange?.(wordsOf(event.currentTarget))}
      onBlur={finish}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Escape') {
          event.preventDefault()
          finish()
        }
      }}
    />
  )
}
