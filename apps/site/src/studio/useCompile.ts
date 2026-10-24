import { useEffect, useRef, useState } from 'react'
import { api } from './api.ts'
import type { ErrorAt } from './scssModule.ts'
import { customBreakpoints, type ThemeSpec } from './spec.ts'

export interface Compiled {
  scss: string
  css: string
  effects?: string
  /** The whole stylesheet, built for the theme's own breakpoints. */
  full: boolean
}

export interface CompileState {
  compiled: Compiled
  /** Building a whole stylesheet (slow): only a theme with its own breakpoints does. */
  building: boolean
  errors: string[]
  /** Where the last compile error is, when it's in a component's SCSS. */
  errorAt?: ErrorAt
  /** Shows errors from elsewhere (a save the server refused). */
  setErrors: (errors: string[]) => void
}

/**
 * Compiles the spec through the real kit as you type, once `ready` (the file
 * is known); the preview keeps the last good CSS while there are errors.
 */
export const useCompile = (spec: ThemeSpec, ready: boolean): CompileState => {
  const [compiled, setCompiled] = useState<Compiled>({ scss: '', css: '', full: false })
  const [building, setBuilding] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [errorAt, setErrorAt] = useState<ErrorAt>()
  /** The latest compile, so a slow one (a whole stylesheet) never lands after a newer. */
  const latest = useRef(0)

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(async () => {
      const run = ++latest.current
      setBuilding(!!customBreakpoints(spec))
      const result = await api.compile(spec)
      if (run !== latest.current) return
      setBuilding(false)
      setErrors(result.errors ?? [])
      setErrorAt(result.at)
      if (result.css !== undefined)
        setCompiled({
          scss: result.scss!,
          css: result.css,
          effects: result.effects,
          full: !!result.full,
        })
    }, 150)
    return () => clearTimeout(timer)
  }, [spec, ready])

  return { compiled, building, errors, errorAt, setErrors }
}
