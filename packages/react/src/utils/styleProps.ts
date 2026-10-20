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
  /**
   * Margin on all four sides: a space token (`0`–`8`, where `4` is 1rem) or any
   * CSS length, per breakpoint if you like (`{ xs: 2, md: 4 }`).
   */
  m?: Responsive<SpaceValue>
  /**
   * Margin on the inline start and end (left and right in English). A space
   * token or any CSS length, per breakpoint if you like.
   */
  mx?: Responsive<SpaceValue>
  /**
   * Margin on the block start and end (top and bottom). A space token or any CSS
   * length, per breakpoint if you like.
   */
  my?: Responsive<SpaceValue>
  /**
   * Margin on the block start (top). A space token or any CSS length, per
   * breakpoint if you like.
   */
  mt?: Responsive<SpaceValue>
  /**
   * Margin on the block end (bottom). A space token or any CSS length, per
   * breakpoint if you like.
   */
  mb?: Responsive<SpaceValue>
  /**
   * Margin on the inline start (left in left-to-right text, right in
   * right-to-left). A space token or any CSS length, per breakpoint if you like.
   */
  ms?: Responsive<SpaceValue>
  /**
   * Margin on the inline end (right in left-to-right text, left in
   * right-to-left). A space token or any CSS length, per breakpoint if you like.
   */
  me?: Responsive<SpaceValue>
  /**
   * Padding on all four sides: a space token (`0`–`8`, where `4` is 1rem) or any
   * CSS length, per breakpoint if you like (`{ xs: 3, md: 5 }`).
   */
  p?: Responsive<SpaceValue>
  /**
   * Padding on the inline start and end (left and right in English). A space
   * token or any CSS length, per breakpoint if you like.
   */
  px?: Responsive<SpaceValue>
  /**
   * Padding on the block start and end (top and bottom). A space token or any
   * CSS length, per breakpoint if you like.
   */
  py?: Responsive<SpaceValue>
  /**
   * Padding on the block start (top). A space token or any CSS length, per
   * breakpoint if you like.
   */
  pt?: Responsive<SpaceValue>
  /**
   * Padding on the block end (bottom). A space token or any CSS length, per
   * breakpoint if you like.
   */
  pb?: Responsive<SpaceValue>
  /**
   * Padding on the inline start (left in left-to-right text, right in
   * right-to-left). A space token or any CSS length, per breakpoint if you like.
   */
  ps?: Responsive<SpaceValue>
  /**
   * Padding on the inline end (right in left-to-right text, left in
   * right-to-left). A space token or any CSS length, per breakpoint if you like.
   */
  pe?: Responsive<SpaceValue>
  /**
   * Space between children, when this element is a flex or grid container: a
   * space token or any CSS length, per breakpoint if you like.
   */
  gap?: Responsive<SpaceValue>
  /** Inline size (width in horizontal writing), any CSS length. */
  w?: Responsive<string>
  /** Maximum inline size, any CSS length. */
  maxW?: Responsive<string>
  /**
   * The CSS `display` value (`flex`, `grid`, `none`…), per breakpoint if you
   * like: `{ xs: 'none', md: 'block' }` shows it from md up.
   */
  display?: Responsive<Display>
  /**
   * Text alignment: logical `start` and `end` follow the writing direction. Per
   * breakpoint if you like.
   */
  textAlign?: Responsive<'start' | 'center' | 'end' | 'justify'>
}

const B = 'greese-Box'

// Spacing props go inline as `var(--greese-space-N)` instead of one class per
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
