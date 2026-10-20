import {
  Children,
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefCallback,
} from 'react'
import { cx } from '../../utils/cx.ts'

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  /** One element, which receives Slot's props, merged with its own. */
  children?: ReactNode
  /** Merged with the child's own ref; both receive the element. */
  ref?: Ref<HTMLElement>
}

/**
 * Renders its single child element with the Slot's props merged in. Powers
 * `asChild` on GreeseUI components, so a component's behaviour and styling can
 * land on your element (a router `<Link>`, say) instead of a wrapper.
 *
 * Merge rules: the child's props win; `className`s are joined; `style`s are
 * merged (child wins per property); event handlers both run, child first; refs
 * are composed.
 */
export const Slot = ({ children, ref, ...slotProps }: SlotProps): ReactNode => {
  // With a <Slottable>, its child is the host and the Slot's other children
  // (a Button's icons, say) are placed around the host's own children.
  const parts = Children.toArray(children)
  const slottable = parts.find(isSlottable)
  if (slottable) {
    const host = slottable.props.children
    if (!isValidElement(host)) return null
    const hostElement = host as ReactElement<Record<string, unknown>>
    return cloneElement(
      hostElement,
      {
        ...mergeProps(slotProps as Record<string, unknown>, hostElement.props),
        ref: composeRefs(ref, hostElement.props.ref as Ref<HTMLElement> | undefined),
      },
      ...parts.map((part) =>
        part === slottable ? (hostElement.props.children as ReactNode) : part
      )
    )
  }

  if (!isValidElement(children)) {
    if (Children.count(children) > 1) {
      throw new Error('Slot (asChild) expects exactly one React element child.')
    }
    return null
  }
  const child = children as ReactElement<Record<string, unknown>>
  const childProps = child.props
  return cloneElement(child, {
    ...mergeProps(slotProps as Record<string, unknown>, childProps),
    ref: composeRefs(ref, childProps.ref as Ref<HTMLElement> | undefined),
  })
}

/**
 * Marks which child of a Slot is the host element. Components that add their
 * own content (icons, spinners) wrap `children` in it, so `asChild` still works:
 *
 * ```tsx
 * <Root>{icon}<Slottable>{children}</Slottable></Root>
 * ```
 *
 * Outside a Slot it renders its children unchanged.
 */
export const Slottable = ({ children }: { children?: ReactNode }): ReactNode => children

const isSlottable = (
  node: ReturnType<typeof Children.toArray>[number]
): node is ReactElement<{ children?: ReactNode }> =>
  isValidElement(node) && node.type === Slottable

const HANDLER = /^on[A-Z]/

const mergeProps = (
  slot: Record<string, unknown>,
  child: Record<string, unknown>
): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...slot, ...child }
  for (const key of Object.keys(slot)) {
    const s = slot[key]
    const c = child[key]
    if (HANDLER.test(key) && typeof s === 'function' && typeof c === 'function') {
      merged[key] = (...args: unknown[]) => {
        c(...args)
        s(...args)
      }
    } else if (key === 'className') {
      merged[key] = cx(s as string | undefined, c as string | undefined)
    } else if (key === 'style' && s && c) {
      merged[key] = { ...(s as object), ...(c as object) }
    }
  }
  return merged
}

const setRef = <T,>(ref: Ref<T> | undefined, value: T | null): void | (() => void) => {
  if (typeof ref === 'function') return ref(value)
  if (ref) ref.current = value
}

/**
 * Combines refs into one. Returns the sole ref unchanged when only one is set,
 * so the common case keeps a stable identity and never re-attaches.
 */
export const composeRefs = <T,>(
  ...refs: Array<Ref<T> | undefined>
): Ref<T> | undefined => {
  const defined = refs.filter((r) => r != null)
  if (defined.length <= 1) return defined[0]
  const callback: RefCallback<T> = (node) => {
    const cleanups = defined.map((r) => setRef(r, node))
    return () => {
      cleanups.forEach((cleanup, i) =>
        typeof cleanup === 'function' ? cleanup() : setRef(defined[i], null)
      )
    }
  }
  return callback
}
