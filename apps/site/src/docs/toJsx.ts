/**
 * A rendered element as JSX source: what a story's "Show code" shows and the
 * live editor starts from, as Storybook generates it from the story's output.
 * Components are named from the library's own exports, since a production
 * build minifies function names; fragments passed as children are flattened.
 */
import {
  createElement,
  Fragment,
  isValidElement,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from 'react'
import * as Greese from '@greese/react'
import * as Svg from '@greese/react/svg'
import * as Icons from '@greese/icons'

// Every module the live editor's scope draws components from (LiveCode.tsx):
// one left out is named by its minified function name (`W` for `Drawing`).
const NAMES = new Map<unknown, string>(
  Object.entries({ ...Greese, ...Svg, ...Icons })
    .filter(([name, value]) => /^[A-Z]/.test(name) && value)
    .map(([name, value]) => [value, name])
)

const WIDTH = 80

/** The stand-ins decorators render for the story, and what each stands for. */
const HOLES = new WeakMap<object, ReactNode>()

type AnyElement = ReactElement<Record<string, unknown>>

const nameOf = (type: unknown): string => {
  if (typeof type === 'string') return type
  if (type === Fragment) return ''
  const named = NAMES.get(type)
  if (named) return named
  const component = type as {
    displayName?: string
    name?: string
    render?: { name?: string }
  }
  return component.displayName || component.name || component.render?.name || 'Component'
}

/**
 * A story file's own helpers the live editor needs in scope
 * (`parameters.tryIt.scope`: `{ Replay }`). Their names in its code come from
 * their `displayName`s (server/storyNames.ts).
 */
export const storyScope = (parameters: Record<string, unknown> | undefined): Context => {
  const tryIt = parameters?.tryIt as { scope?: Context } | false | undefined
  return (tryIt && tryIt.scope) || {}
}

/** A component's name, as the library exports it: `Button`, `SearchIcon`. */
export const componentName = (type: unknown): string => nameOf(type)

const quote = (text: string) => JSON.stringify(text)

/** A prop's value as an expression; undefined to leave the prop out. */
const valueOf = (value: unknown, indent: string): string | undefined => {
  if (value === undefined) return undefined
  if (typeof value === 'function') return '() => {}'
  if (isValidElement(value)) {
    // Several elements in one prop need their fragment back, or they aren't one expression.
    if (value.type === Fragment && flatten(value).length > 1)
      return `<>\n${toJsx(value, `${indent}  `)}\n${indent}</>`
    return toJsx(value as AnyElement, indent).trim()
  }
  if (Array.isArray(value))
    return `[${value.map((v) => valueOf(v, indent) ?? 'undefined').join(', ')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => {
        const shown = valueOf(v, indent)
        if (shown === undefined) return undefined
        return `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k)}: ${shown}`
      })
      .filter(Boolean)
    return `{ ${entries.join(', ')} }`
  }
  return typeof value === 'string' ? quote(value) : String(value)
}

const attribute = (name: string, value: unknown, indent: string): string | undefined => {
  if (value === true) return name
  if (typeof value === 'string' && !value.includes('"') && !value.includes('\n'))
    return `${name}="${value}"`
  const shown = valueOf(value, indent)
  return shown === undefined ? undefined : `${name}={${shown}}`
}

/** Children as a flat list: fragments opened, empty values dropped. */
const flatten = (children: ReactNode): ReactNode[] => {
  const out: ReactNode[] = []
  const visit = (node: ReactNode) => {
    if (node === null || node === undefined || typeof node === 'boolean') return
    if (Array.isArray(node)) return node.forEach(visit)
    if (isValidElement(node) && node.type === Fragment)
      return visit((node.props as { children?: ReactNode }).children)
    out.push(node)
  }
  visit(children)
  return out
}

/** One element, and everything inside it, as indented JSX. */
export const toJsx = (element: ReactNode, indent = ''): string => {
  if (!isValidElement(element)) {
    if (element === null || element === undefined || typeof element === 'boolean')
      return ''
    return `${indent}${String(element)}`
  }
  const el = element as AnyElement
  if (el.type === Fragment)
    return flatten(el)
      .map((c) => toJsx(c, indent))
      .join('\n')
  if (HOLES.has(el.type as object)) return toJsx(HOLES.get(el.type as object), indent)
  const name = nameOf(el.type)
  const { children, ...props } = el.props
  const inner = `${indent}  `
  const attrs = Object.entries(props)
    .filter(([key]) => key !== 'key' && key !== 'ref')
    .map(([key, value]) => attribute(key, value, inner))
    .filter((a): a is string => !!a)
  const kids = flatten(children as ReactNode)

  const oneLine = attrs.length ? ` ${attrs.join(' ')}` : ''
  const open =
    (`${indent}<${name}${oneLine}`.length + 1 > WIDTH && attrs.length > 1) ||
    attrs.some((a) => a.includes('\n'))
      ? `${indent}<${name}\n${attrs.map((a) => `${inner}${a}`).join('\n')}\n${indent}`
      : `${indent}<${name}${oneLine}`
  if (!kids.length) return `${open}${open.endsWith('\n' + indent) ? '' : ' '}/>`
  // A single short text child stays on the line.
  if (kids.length === 1 && !isValidElement(kids[0])) {
    const line = `${open}>${String(kids[0])}</${name}>`
    if (!line.includes('\n') && line.length <= WIDTH) return line
  }
  return `${open}>\n${kids.map((c) => toJsx(c, inner)).join('\n')}\n${indent}</${name}>`
}

type Context = Record<string, unknown>
type Render = (args: Record<string, unknown>, context: Context) => unknown
/** A decorator, as a story file writes one: `(Story) => <Table>…<Story /></Table>`. */
export type Decorator = (Story: () => unknown, context: Context) => unknown

/**
 * What a story renders, as code: its render (or the component with its args)
 * called with the args it's shown with, inside its decorators, as
 * Storybook's source includes them: a part's file decorates it with its
 * parent, without which the code wouldn't run. Called during a component's
 * render, so a render that uses hooks keeps working.
 */
export const storySnippet = (
  render: Render | undefined,
  component: unknown,
  args: Record<string, unknown>,
  context: Context,
  decorators: readonly Decorator[] = []
): string => {
  let element = (
    render
      ? render(args, context)
      : component
        ? createElement(component as ElementType, args)
        : null
  ) as ReactNode
  if (element === null) return ''
  // Innermost first, as Storybook composes them. A decorator renders `<Story />`
  // or calls `Story()`: either way, the story's own element goes there.
  for (const decorator of decorators) {
    const inner = element
    const Story = () => inner
    HOLES.set(Story, inner)
    element = decorator(Story, context) as ReactNode
  }
  return toJsx(element)
}
