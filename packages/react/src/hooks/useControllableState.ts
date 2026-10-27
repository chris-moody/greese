'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface UseControllableStateOptions<T> {
  /** Controlled value. `undefined` means uncontrolled. */
  value?: T
  /** Initial value when uncontrolled. */
  defaultValue: T
  /** Called with each new value, controlled or not. */
  onChange?: (value: T) => void
}

type SetState<T> = (next: T | ((previous: T) => T)) => void

/**
 * State that a parent may control (`value` + `onChange`) or leave to the
 * component (`defaultValue`), the pattern every greese ui input follows.
 *
 * `T` must not be a function type: a function passed to the setter is treated
 * as an updater. The setter's identity is stable.
 */
export const useControllableState = <T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, SetState<T>] => {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  const currentRef = useRef(current)
  const onChangeRef = useRef(onChange)
  useLayoutEffect(() => {
    currentRef.current = current
    onChangeRef.current = onChange
  })

  // Uncontrolled: report changes after commit, so updaters stay pure and
  // batched updates report the settled value once.
  const reported = useRef(internal)
  useEffect(() => {
    if (!isControlled && !Object.is(reported.current, internal)) {
      reported.current = internal
      onChangeRef.current?.(internal)
    }
  }, [internal, isControlled])

  const setValue = useCallback<SetState<T>>(
    (next) => {
      if (isControlled) {
        const resolved =
          typeof next === 'function' ? (next as (p: T) => T)(currentRef.current) : next
        if (!Object.is(resolved, currentRef.current)) onChangeRef.current?.(resolved)
      } else {
        setInternal(next)
      }
    },
    [isControlled]
  )

  return [current, setValue]
}
