import { migrateSpec } from './migrate.ts'
import type { ThemeSpec } from './spec.ts'

/**
 * Where the hosted studio keeps the theme you save (Save writes it, and says
 * so when the browser won't): your saved file, in this browser.
 */
export const KEY = 'greese-theme-studio'

/**
 * Where the site keeps the theme being worn: every pick in the theme menu,
 * colors, shapes and motion, kept between visits (App's `useStoredState`).
 * Apart from the saved one, so picking doesn't count as saving.
 */
export const WORN = 'greese-theme'

/** Whether a stored value is a theme spec at all (an older or foreign value is ignored). */
export const isSpec = (value: unknown): value is ThemeSpec =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** The theme saved in the hosted studio, if any. */
export const stored = (): ThemeSpec | undefined => {
  try {
    const text = localStorage.getItem(KEY)
    const value: unknown = text ? JSON.parse(text) : undefined
    return isSpec(value) ? migrateSpec(value) : undefined
  } catch {
    return undefined
  }
}
