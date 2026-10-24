import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'

type Component = (props: Record<string, unknown>) => ReactNode

/**
 * What a Server Component would hand the browser: renders `node` the way the
 * server does, calling the given server components (they use no hooks), and
 * lists every function given to a host element as a prop, by element and
 * prop name. A Server Component can't do that, so the list must be empty.
 */
export const functionProps = (node: ReactNode, server: Component[]): string[] => {
  const found: string[] = []
  const visit = (child: ReactNode) => {
    if (!isValidElement(child)) return
    const element = child as ReactElement<Record<string, unknown>>
    if (server.includes(element.type as Component)) {
      return visit((element.type as Component)(element.props))
    }
    if (typeof element.type === 'string') {
      for (const [key, value] of Object.entries(element.props))
        if (typeof value === 'function' && key !== 'ref')
          found.push(`<${element.type}> ${key}`)
    }
    Children.forEach(element.props.children as ReactNode, visit)
  }
  visit(node)
  return found
}
