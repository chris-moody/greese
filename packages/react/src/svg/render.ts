import { createElement, type ReactElement, type ReactNode } from 'react'
import type { SvgNode } from '@greese/svg'

// SVG's hyphenated attributes (`stop-color`) are camelCase props in React
// (`stopColor`), which writes them back hyphenated; data- and aria- stay.
const prop = (name: string) =>
  /^(data|aria)-/.test(name)
    ? name
    : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

/**
 * An `@greese/svg` node as React elements: the gradients, filters, clip
 * paths and masks it builds render the same in React as in plain DOM.
 * `props` and `children` are added to the root.
 */
export const toReact = (
  node: SvgNode,
  props: Record<string, unknown> = {},
  children?: ReactNode,
  key?: number
): ReactElement => {
  const attrs: Record<string, unknown> = { key }
  for (const [name, value] of Object.entries(node.attrs))
    if (value !== undefined && value !== false)
      attrs[prop(name)] = value === true ? '' : value
  return createElement(
    node.tag,
    { ...attrs, ...props },
    ...node.children.map((child, i) => toReact(child, {}, undefined, i)),
    children
  )
}
