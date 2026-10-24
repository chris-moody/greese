import { useRef } from 'react'

/**
 * `value`, or the one from an earlier render while it serializes the same:
 * a dependency that changes when its content does, not each time an object
 * is rebuilt. For plain data (a theme spec or part of one), small enough to
 * serialize each render.
 */
export const useStable = <T>(value: T): T => {
  const json = JSON.stringify(value) ?? ''
  const last = useRef({ value, json })
  // Kept from render to render, not derived: the identity is the point.
  if (last.current.json !== json) last.current = { value, json }
  return last.current.value
}
