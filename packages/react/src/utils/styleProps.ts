import {
  neverToken,
  spaceToCss,
  type Responsive,
  type ResponsiveConfig,
  type ResponsiveEntry,
  type SpaceValue,
} from './responsive.ts'

export type Display =
  | 'block'
  | 'inline'
  | 'inline-block'
  | 'flex'
  | 'inline-flex'
  | 'grid'
  | 'inline-grid'
  | 'none'
  | 'contents'

/**
 * Typed, responsive style props shared by Box and the layout components built
 * on it. Spacing takes a scale token (`0`–`8`) or any CSS length. Edges are
 * logical: `ms`/`me` are inline start/end, `mt`/`mb` block start/end, so
 * layouts flip correctly in right-to-left languages.
 */
export interface BoxStyleProps {
  m?: Responsive<SpaceValue>
  mx?: Responsive<SpaceValue>
  my?: Responsive<SpaceValue>
  mt?: Responsive<SpaceValue>
  mb?: Responsive<SpaceValue>
  ms?: Responsive<SpaceValue>
  me?: Responsive<SpaceValue>
  p?: Responsive<SpaceValue>
  px?: Responsive<SpaceValue>
  py?: Responsive<SpaceValue>
  pt?: Responsive<SpaceValue>
  pb?: Responsive<SpaceValue>
  ps?: Responsive<SpaceValue>
  pe?: Responsive<SpaceValue>
  gap?: Responsive<SpaceValue>
  /** Inline size (width in horizontal writing), any CSS length. */
  w?: Responsive<string>
  /** Maximum inline size, any CSS length. */
  maxW?: Responsive<string>
  display?: Responsive<Display>
  textAlign?: Responsive<'start' | 'center' | 'end' | 'justify'>
}

const B = 'sauce-Box'

// Spacing props go inline as `var(--sauce-space-N)` instead of one class per
// token per breakpoint per prop (~600 classes); values stay themeable.
const space = (prop: string): ResponsiveConfig => ({
  block: B,
  prop,
  isToken: neverToken,
  toCss: spaceToCss,
})

/** Order matters: the SCSS declares longhands after shorthands. */
const configs: { readonly [K in keyof BoxStyleProps]-?: ResponsiveConfig } = {
  m: space('m'),
  mx: space('mx'),
  my: space('my'),
  mt: space('mt'),
  mb: space('mb'),
  ms: space('ms'),
  me: space('me'),
  p: space('p'),
  px: space('px'),
  py: space('py'),
  pt: space('pt'),
  pb: space('pb'),
  ps: space('ps'),
  pe: space('pe'),
  gap: space('gap'),
  w: { block: B, prop: 'w', isToken: neverToken },
  maxW: { block: B, prop: 'max-w', isToken: neverToken },
  display: { block: B, prop: 'display' },
  textAlign: { block: B, prop: 'text-align' },
}

const keys = Object.keys(configs) as Array<keyof BoxStyleProps>

/**
 * Separates style props from everything else, pairing each with its config
 * for resolveResponsive(). Only props actually passed produce entries.
 */
export const splitStyleProps = <P extends BoxStyleProps>(
  props: P
): [entries: ResponsiveEntry[], rest: Omit<P, keyof BoxStyleProps>] => {
  const entries: ResponsiveEntry[] = []
  const rest = { ...props } as Record<string, unknown>
  for (const key of keys) {
    if (key in rest) {
      entries.push([rest[key] as ResponsiveEntry[0], configs[key]])
      delete rest[key]
    }
  }
  return [entries, rest as Omit<P, keyof BoxStyleProps>]
}
