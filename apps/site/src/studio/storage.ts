import type { ThemeSpec } from './spec.ts'

/** Where the hosted studio keeps the saved theme, shared with the homepage's theme choice. */
export const KEY = 'greese-theme-studio'

export const stored = (): ThemeSpec | undefined => {
  try {
    const text = localStorage.getItem(KEY)
    return text ? (JSON.parse(text) as ThemeSpec) : undefined
  } catch {
    return undefined
  }
}
