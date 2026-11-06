/**
 * A built example of a component with every element that belongs to it, and
 * to what it contains and is built on, outlined and labelled with the
 * `greese-*` classes it carries. Nesting shows as colour; the list under it
 * is the same tree as text. Every disclosure starts open, and can be closed.
 * The elements are found by walking the rendered DOM, not from a list: what
 * is labelled is what is there. Shared by the docs pages' Styling section and
 * Theme Studio's component preview.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react'
import manifest from '@greese/ui/style-manifest.json' with { type: 'json' }
import { anatomyColors, backgroundOf, type AnatomyColor } from './anatomyColors.ts'
import './anatomy.css'

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

const BLOCK = /^greese-([A-Z][A-Za-z]*)/

/** The component a class belongs to: `greese-Button-icon` → `Button`. */
const blockOf = (cls: string): string | undefined => {
  const name = BLOCK.exec(cls)?.[1]
  return name && name in manifest.blocks ? name : undefined
}

/**
 * A label's classes as lines no wider than `max` px: a class per line where
 * two don't fit, and one too long for a line broken where it must be.
 */
const wrap = (classes: string[], max: number): string[] => {
  const perLine = Math.max(8, Math.floor((max - 8) / CHAR_WIDTH))
  const lines: string[] = []
  for (const word of classes.map((c) => `.${c}`)) {
    const last = lines.at(-1)
    if (last !== undefined && last.length + 1 + word.length <= perLine)
      lines[lines.length - 1] = `${last} ${word}`
    else
      for (let i = 0; i < word.length; i += perLine)
        lines.push(word.slice(i, i + perLine))
  }
  return lines
}

const overlaps = (a: Part['label'], b: Part['label']): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const colorVars = (color: AnatomyColor | undefined): CSSProperties =>
  ({ '--anatomy-color': color?.color, '--anatomy-on-color': color?.on }) as CSSProperties

export interface AnatomyProps {
  /** The component, to name the element list. */
  name: string
  /** The style blocks that are its own: its, its items', and what it's built on. */
  family: readonly string[]
  /** The example to take apart. */
  children: ReactNode
}

export const Anatomy = ({ name, family, children }: AnatomyProps): JSX.Element => {
  const canvas = useRef<HTMLDivElement>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [colors, setColors] = useState<AnatomyColor[]>([])
  /** The disclosures already opened, so one you close stays closed. */
  const opened = useRef(new WeakSet<HTMLDetailsElement>())
  const familyKey = family.join(' ')

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
    const own = new Set(familyKey.split(' '))
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
      // Only what's on screen: a carousel's other slides, a closed panel's
      // content, are there but hidden, often moved out of the way.
      if (!el.checkVisibility({ visibilityProperty: true })) continue
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
    // Readable on whatever the page is wearing now: the theme or scheme may
    // have changed since the last measure.
    const depths = Math.max(1, ...found.map((p) => p.depth + 1))
    setColors(anatomyColors(backgroundOf(root.parentElement!), depths))
  }, [familyKey])

  // Measure after the example renders, and whenever its content, the theme,
  // the scheme or the size changes.
  useLayoutEffect(measure, [measure])
  useEffect(() => {
    const root = canvas.current
    if (!root) return
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    // An example that renders late (a docs block, a lazy story) adds its
    // elements after the first measure.
    const content = new MutationObserver(measure)
    content.observe(root, { childList: true, subtree: true })
    const scheme = new MutationObserver(measure)
    scheme.observe(document.documentElement, {
      attributeFilter: ['data-greese-scheme', 'data-greese-theme', 'class', 'style'],
    })
    const dark = matchMedia('(prefers-color-scheme: dark)')
    dark.addEventListener('change', measure)
    // Theme Studio announces each new theme stylesheet.
    window.addEventListener('studio:css', measure)
    // A disclosure opening or closing moves what follows it; `toggle` doesn't bubble.
    root.addEventListener('toggle', measure, true)
    root.addEventListener('transitionend', measure)
    return () => {
      observer.disconnect()
      content.disconnect()
      scheme.disconnect()
      dark.removeEventListener('change', measure)
      window.removeEventListener('studio:css', measure)
      root.removeEventListener('toggle', measure, true)
      root.removeEventListener('transitionend', measure)
    }
  }, [measure])

  return (
    <div className="anatomy-frame">
      <div
        className="anatomy"
        style={
          {
            '--anatomy-height': `${Math.max(0, ...parts.map((p) => p.label.y + p.label.h + 8))}px`,
          } as CSSProperties
        }
      >
        <div ref={canvas} className="anatomy-canvas">
          {children}
        </div>
        <div className="anatomy-marks" aria-hidden="true">
          {/* Not an icon: the leader lines from each element to its label. */}
          {/* eslint-disable-next-line no-restricted-syntax */}
          <svg className="anatomy-lines" width="1" height="1">
            {parts.map((part) => (
              <line
                key={part.id}
                x1={part.box.x + part.box.w}
                y1={part.box.y + LABEL_HEIGHT / 2 + 2}
                x2={part.label.x}
                y2={part.label.y + LABEL_HEIGHT / 2}
                style={colorVars(colors[part.depth])}
              />
            ))}
          </svg>
          {parts.map((part) => (
            <div key={part.id} style={colorVars(colors[part.depth])}>
              <span
                className="anatomy-box"
                style={{
                  left: part.box.x,
                  top: part.box.y,
                  width: part.box.w,
                  height: part.box.h,
                }}
              />
              <span
                className="anatomy-label"
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
      <ul className="anatomy-tree" aria-label={`${name} elements and their classes`}>
        {parts.map((part) => (
          <li key={part.id} style={{ paddingInlineStart: `${part.depth * 1.25}rem` }}>
            <span className="anatomy-tag" style={colorVars(colors[part.depth])}>
              &lt;{part.tag}&gt;
            </span>{' '}
            {part.classes.map((c) => (
              <code key={c}>.{c}</code>
            ))}
          </li>
        ))}
        {parts.length === 0 && <li className="anatomy-measuring">Measuring…</li>}
      </ul>
    </div>
  )
}
