import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from 'react'
import { Stack, Text } from '@greese/react'
import { familyOf } from '../family.ts'
import { blockOf } from '../manifest.ts'

interface Part {
  id: number
  depth: number
  tag: string
  classes: string[]
  box: { x: number; y: number; w: number; h: number }
  label: { x: number; y: number; w: number; h: number }
  /** The label's text, a line each where its classes don't fit the gutter. */
  lines: string[]
}

const LABEL_HEIGHT = 15
const CHAR_WIDTH = 6.1
/** Space between the example and its labels. */
const GUTTER_GAP = 28
/**
 * Space kept between the labels and the edge of what holds the diagram: its
 * padding, and room for a shape that cuts into its sides (a ticket's notch).
 */
const EDGE_GAP = 24

/**
 * A label's classes as lines no wider than `max` px: a class per line where
 * two don't fit, and one too long for a line broken where it must be.
 */
const wrap = (classes: string[], max: number): string[] => {
  const perLine = Math.max(8, Math.floor((max - 8) / CHAR_WIDTH))
  const lines: string[] = []
  for (const word of classes.map((c) => `.${c}`)) {
    const last = lines.at(-1)
    if (last !== undefined && last.length + 1 + word.length <= perLine) lines[lines.length - 1] = `${last} ${word}`
    else for (let i = 0; i < word.length; i += perLine) lines.push(word.slice(i, i + perLine))
  }
  return lines
}

const overlaps = (a: Part['label'], b: Part['label']): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

/**
 * A built example of the component with every element that belongs to it, and to
 * what it contains and is built on, outlined and labelled with the `greese-*`
 * classes it carries, so each can be found and edited in the code box. Nesting
 * shows as colour; the list under it is the same tree as text. Every
 * disclosure starts open, and can be closed. The elements are found by
 * walking the rendered DOM, not from a list: what is labelled is what is there.
 */
export const Anatomy = ({
  block,
  children,
}: {
  block: string
  children: ReactNode
}): JSX.Element => {
  const canvas = useRef<HTMLDivElement>(null)
  const [family, setFamily] = useState<string[]>([block])
  const [parts, setParts] = useState<Part[]>([])
  /** The disclosures already opened, so one you close stays closed. */
  const opened = useRef(new WeakSet<HTMLDetailsElement>())

  useEffect(() => {
    let current = true
    setFamily([block])
    void familyOf(block).then((blocks) => current && setFamily(blocks))
    return () => {
      current = false
    }
  }, [block])

  const measure = useCallback(() => {
    const root = canvas.current
    if (!root) return
    // Every section starts open, once; an exclusive group would close the others.
    // After that they open and close as usual.
    for (const details of root.querySelectorAll('details')) {
      if (opened.current.has(details)) continue
      opened.current.add(details)
      details.removeAttribute('name')
      details.open = true
    }
    const origin = root.getBoundingClientRect()
    // The gutter: from the example's end to the edge of the diagram, less a margin.
    const outer = root.parentElement!.getBoundingClientRect()
    const room = Math.max(80, outer.right - origin.right - GUTTER_GAP - EDGE_GAP)
    const own = new Set(family)
    const classesOf = (el: Element) =>
      [...el.classList].filter(
        (c) => !c.startsWith('greese-Motion') && own.has(blockOf(c) ?? '')
      )
    const found: Part[] = []
    const placed: Part['label'][] = []
    for (const el of root.querySelectorAll<HTMLElement>('*')) {
      const classes = classesOf(el)
      const rect = el.getBoundingClientRect()
      if (!classes.length || !rect.width || !rect.height) continue
      let depth = 0
      for (let up = el.parentElement; up && up !== root; up = up.parentElement)
        if (classesOf(up).length) depth++
      const lines = wrap(classes, room)
      // Labels sit in a gutter to the right of the example, so they never cover it,
      // and wrap inside it, so they never reach the edge of what holds it.
      const label = {
        x: origin.width + GUTTER_GAP,
        y: rect.top - origin.top + 2,
        w: Math.max(...lines.map((l) => l.length)) * CHAR_WIDTH + 8,
        h: LABEL_HEIGHT * lines.length,
      }
      // Nested elements start at the same height: move each label down to a free spot.
      for (let tries = 0; tries < 16 && placed.some((p) => overlaps(label, p)); tries++)
        label.y += LABEL_HEIGHT + 1
      placed.push(label)
      found.push({
        id: found.length,
        depth,
        tag: el.tagName.toLowerCase(),
        classes,
        box: {
          x: rect.left - origin.left,
          y: rect.top - origin.top,
          w: rect.width,
          h: rect.height,
        },
        label,
        lines,
      })
    }
    setParts(found)
  }, [family])

  // Measure after the story renders, after the family is known, and whenever the
  // theme's CSS or the size changes (the studio announces it).
  useLayoutEffect(measure, [measure])
  useEffect(() => {
    const root = canvas.current
    if (!root) return
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    window.addEventListener('studio:css', measure)
    // A disclosure opening or closing moves what follows it; `toggle` doesn't bubble.
    root.addEventListener('toggle', measure, true)
    root.addEventListener('transitionend', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('studio:css', measure)
      root.removeEventListener('toggle', measure, true)
      root.removeEventListener('transitionend', measure)
    }
  }, [measure])

  return (
    <Stack gap={3}>
      <div
        className="studio-anatomy"
        style={{
          minBlockSize: Math.max(0, ...parts.map((p) => p.label.y + p.label.h + 8)),
        }}
      >
        <div ref={canvas} className="studio-anatomy-canvas">
          {children}
        </div>
        <div className="studio-anatomy-marks" aria-hidden="true">
          {/* Not an icon: the leader lines from each element to its label. */}
          {/* eslint-disable-next-line no-restricted-syntax */}
          <svg className="studio-anatomy-lines" width="1" height="1">
            {parts.map((part) => (
              <line
                key={part.id}
                x1={part.box.x + part.box.w}
                y1={part.box.y + LABEL_HEIGHT / 2 + 2}
                x2={part.label.x}
                y2={part.label.y + LABEL_HEIGHT / 2}
                style={{ '--depth': part.depth } as React.CSSProperties}
              />
            ))}
          </svg>
          {parts.map((part) => (
            <div key={part.id} style={{ '--depth': part.depth } as React.CSSProperties}>
              <span
                className="studio-anatomy-box"
                style={{
                  left: part.box.x,
                  top: part.box.y,
                  width: part.box.w,
                  height: part.box.h,
                }}
              />
              <span
                className="studio-anatomy-label"
                style={{ left: part.label.x, top: part.label.y }}
              >
                {part.lines.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
      <ul
        className="studio-anatomy-tree"
        aria-label={`${block} elements and their classes`}
      >
        {parts.map((part) => (
          <li key={part.id} style={{ paddingInlineStart: `${part.depth * 1.25}rem` }}>
            <span
              className="studio-anatomy-tag"
              style={{ '--depth': part.depth } as React.CSSProperties}
            >
              &lt;{part.tag}&gt;
            </span>{' '}
            {part.classes.map((c) => (
              <code key={c}>.{c}</code>
            ))}
          </li>
        ))}
        {parts.length === 0 && (
          <li>
            <Text variant="caption" tone="muted">
              Measuring…
            </Text>
          </li>
        )}
      </ul>
    </Stack>
  )
}
