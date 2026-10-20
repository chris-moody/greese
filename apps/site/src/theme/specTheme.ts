import { createTheme, type Theme } from '@greese/react'
import { siteColors } from '../theme.ts'
import { resolveColor } from '../studio/resolve.ts'
import { isCustomToken, type SchemeValue, type ThemeSpec } from '../studio/spec.ts'

const camel = (value: string): string =>
  value.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())

/** A color value as createTheme takes it: palette names become their hex. */
const asColor = (value: SchemeValue): SchemeValue => {
  if (typeof value === 'string') return resolveColor(value) ?? value
  return {
    light: resolveColor(value.light, 'light') ?? value.light,
    dark: resolveColor(value.dark, 'dark') ?? value.dark,
  }
}

/**
 * The homepage's theme for what the visitor chose in the studio's theme menu:
 * the spec's tokens and typography through `createTheme`, with the site's own
 * colors alongside. (Component and motion edits are the studio preview's, which
 * compiles them through the kit; the page wears the theme's tokens.)
 */
/** A short stable name for a spec: ThemeProvider keys a theme's CSS by its name. */
const nameOf = (spec: ThemeSpec): string => {
  let hash = 0
  for (const char of JSON.stringify(spec)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return `site-${hash.toString(36)}`
}

export const specToTheme = (spec: ThemeSpec): Theme => {
  const options: Record<string, Record<string, unknown>> = {}
  const extend: Record<string, Record<string, SchemeValue>> = { color: { ...siteColors } }
  for (const [group, values] of Object.entries(spec.tokens ?? {})) {
    for (const [key, value] of Object.entries(values)) {
      if (isCustomToken(group, key)) {
        ;(extend[camel(group)] ??= {})[key] = group === 'color' ? asColor(value) : value
        continue
      }
      ;(options[camel(group)] ??= {})[camel(key)] =
        group === 'color' ? asColor(value) : value
    }
  }
  return createTheme({
    name: nameOf(spec),
    ...options,
    extend,
    ...(spec.typography && { typography: spec.typography }),
  } as Parameters<typeof createTheme>[0])
}
