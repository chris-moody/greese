import {
  Children,
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

type Component = (props: Record<string, unknown>) => ReactNode

/**
 * What a Server Component would hand the browser: renders `node` the way the
 * server does, calling the given server components (they use no hooks), and
 * lists every function given to a host element as a prop, by element and
 * prop name. Components not in `server` count as client components, whose
 * props must serialise, so a function handed to one is listed too. Hooks the
 * server allows (`useId`) work: it walks inside a render. A Server Component
 * can't hand on a function, so the list must be empty.
 */
export const functionProps = (node: ReactNode, server: Component[]): string[] => {
  const found: string[] = []
  const visit = (child: ReactNode) => {
    if (!isValidElement(child)) return
    const element = child as ReactElement<Record<string, unknown>>
    if (server.includes(element.type as Component)) {
      return visit((element.type as Component)(element.props))
    }
    // Host elements, and components not listed as server ones (so client
    // components, whose props must serialise), take no functions.
    const name =
      typeof element.type === 'string'
        ? element.type
        : typeof element.type === 'function'
          ? element.type.name
          : undefined
    if (name !== undefined) {
      for (const [key, value] of Object.entries(element.props))
        if (typeof value === 'function' && key !== 'ref') found.push(`<${name}> ${key}`)
    }
    Children.forEach(element.props.children as ReactNode, visit)
  }
  // Walked inside a render, as the server does, so hooks it allows (useId) work.
  const Probe = () => {
    visit(node)
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  return found
}
