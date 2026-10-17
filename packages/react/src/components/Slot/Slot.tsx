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
  children?: ReactNode
  ref?: Ref<HTMLElement>
}

/**
 * Renders its single child element with the Slot's props merged in. Powers
 * `asChild` on SauceUI components, so a component's behaviour and styling can
 * land on your element (a router `<Link>`, say) instead of a wrapper.
 *
 * Merge rules: the child's props win; `className`s are joined; `style`s are
 * merged (child wins per property); event handlers both run, child first; refs
 * are composed.
 */
export const Slot = ({ children, ref, ...slotProps }: SlotProps): ReactNode => {
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
