import { LAYER_ORDER } from './css.ts'
import { kebab } from './kebab.ts'
import { breakpoints as defaultBreakpoints, color, scalarTokens } from './tokens.ts'

/**
 * Utility classes: one declaration (or a small, named set) per class, built
 * from the tokens, in `@layer greese.utilities` so they beat a component's own
 * styles. Defined here, once; everything else is made from this table:
 *
 * - `dist/utilities.css`, the whole set (`@greese/ui/utilities.css`);
 * - `generateUtilities({ used })` and `purgeUtilities({ content })`, which write
 *   only the classes a project uses, found by scanning its source, so unused
 *   CSS never ships (the `greese-utilities` command and the Vite plugin run it);
 * - the docs' class tables.
 *
 * **Names.** `<property>-<value>`: the property's own name and the value's own
 * keyword, so a class reads as the declaration it makes (`display-flex`,
 * `text-center`, `justify-content-between`). Token-valued groups use
 * the token's name (`p-4`, `bg-primary`, `radius-md`,
 * `z-modal`). These abbreviations only, for the properties used most:
 * `m` margin, `p` padding, `w` width, `h` height, `z` z-index, `bg`
 * background-color, `pos` position, `vis` visibility, `flex-dir` flex-direction,
 * `col`/`cols` for column/columns, `text` for text-align, `upper`/`lower` for
 * uppercase/lowercase. Spacing takes a side: `t b l r` (physical), `x y` (the
 * inline and block axes), `s e` (inline start and end, which follow the
 * writing direction): `pt-3`, `mx-auto`, `ms-2`. A breakpoint or
 * `hover` goes first: `md-display-flex`, `hover-opacity-75`.
 * Type size and radius stay tokens and type variants (`text-lg`, `rounded-xl`
 * have no equivalent here).
 *
 * Keep this file's imports to the token modules: the build runs it directly
 * under Node's type stripping.
 */

type Declarations = Readonly<Record<string, string>>

export type UtilityGroup =
  | 'spacing'
  | 'sizing'
  | 'layout'
  | 'flex'
  | 'grid'
  | 'typography'
  | 'border'
  | 'color'
  | 'effects'

interface UtilityDefinition {
  group: UtilityGroup
  /** The class, without any variant: `mt`, `display`, `text-align`. */
  stem: string
  /** The property (or properties) a plain value is set on. */
  property?: string | readonly string[]
  /** The class's value part and what it sets: a CSS value, or whole declarations. `''` is the stem alone. */
  values: Readonly<Record<string, string | Declarations>>
  /** Also written for each breakpoint (`md-…`): `true`, or only these breakpoints. */
  responsive?: boolean
  /** Also written for hover (`hover-…`). */
  hover?: boolean
}

const keys = <T extends object>(record: T): string[] => Object.keys(record)

const fromTokens = (group: string, names: string[], transform = (name: string) => name) =>
  Object.fromEntries(
    names.map((name) => [kebab(name), `var(--greese-${kebab(group)}-${transform(name)})`])
  )

const space = fromTokens('space', keys(scalarTokens.space), String)
const colors = {
  ...Object.fromEntries(
    keys(color).map((role) => [kebab(role), `var(--greese-color-${kebab(role)})`])
  ),
  transparent: 'transparent',
  inherit: 'inherit',
  current: 'currentcolor',
}

const sizes = {
  '0': '0',
  '25': '25%',
  '50': '50%',
  '75': '75%',
  full: '100%',
  auto: 'auto',
  fit: 'fit-content',
  min: 'min-content',
  max: 'max-content',
}

const alignment = ['start', 'end', 'center', 'stretch'] as const
const spread = {
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
}
const same = (...names: string[]): Record<string, string> =>
  Object.fromEntries(names.map((name) => [name, name]))

const counts = (max: number, of: (n: number) => string) =>
  Object.fromEntries(Array.from({ length: max }, (_, i) => [String(i + 1), of(i + 1)]))

/** `{ '': width style color, '0': none, '2', '4' }` for a border on some side. */
const borderOn = (side: string): Record<string, Declarations> => {
  const edge = (width: string): Declarations => ({
    [`border${side}-width`]: width,
    [`border${side}-style`]: 'solid',
    [`border${side}-color`]: 'var(--greese-color-border)',
  })
  return {
    '': edge('1px'),
    '0': { [`border${side}-width`]: '0' },
    '2': edge('2px'),
    '4': edge('4px'),
  }
}

const SIDES: Record<string, string> = {
  '': '',
  x: '-inline',
  y: '-block',
  t: '-top',
  b: '-bottom',
  l: '-left',
  r: '-right',
  s: '-inline-start',
  e: '-inline-end',
}

const definitions: UtilityDefinition[] = [
  // Spacing: the scale's tokens, on every side.
  ...Object.entries(SIDES).flatMap(([side, suffix]): UtilityDefinition[] => [
    {
      group: 'spacing',
      stem: `m${side}`,
      property: `margin${suffix}`,
      values: { ...space, auto: 'auto' },
      responsive: true,
    },
    {
      group: 'spacing',
      stem: `p${side}`,
      property: `padding${suffix}`,
      values: space,
      responsive: true,
    },
  ]),
  { group: 'spacing', stem: 'gap', property: 'gap', values: space, responsive: true },
  {
    group: 'spacing',
    stem: 'gap-x',
    property: 'column-gap',
    values: space,
    responsive: true,
  },
  {
    group: 'spacing',
    stem: 'gap-y',
    property: 'row-gap',
    values: space,
    responsive: true,
  },

  // Sizing: the logical properties, so they follow the writing direction.
  {
    group: 'sizing',
    stem: 'w',
    property: 'inline-size',
    values: { ...sizes, screen: '100vw' },
    responsive: true,
  },
  {
    group: 'sizing',
    stem: 'h',
    property: 'block-size',
    values: { ...sizes, screen: '100dvh' },
    responsive: true,
  },
  { group: 'sizing', stem: 'min-w', property: 'min-inline-size', values: sizes },
  {
    group: 'sizing',
    stem: 'max-w',
    property: 'max-inline-size',
    values: { ...sizes, none: 'none' },
  },
  {
    group: 'sizing',
    stem: 'min-h',
    property: 'min-block-size',
    values: { ...sizes, screen: '100dvh' },
  },
  {
    group: 'sizing',
    stem: 'max-h',
    property: 'max-block-size',
    values: { ...sizes, none: 'none' },
  },
  {
    group: 'sizing',
    stem: 'size',
    property: ['inline-size', 'block-size'],
    values: { full: '100%', auto: 'auto', fit: 'fit-content' },
  },
  {
    group: 'sizing',
    stem: 'aspect-ratio',
    property: 'aspect-ratio',
    values: { auto: 'auto', square: '1 / 1', video: '16 / 9', photo: '4 / 3' },
  },
  {
    group: 'sizing',
    stem: 'object-fit',
    property: 'object-fit',
    values: same('contain', 'cover', 'fill', 'none', 'scale-down'),
  },

  // Layout.
  {
    group: 'layout',
    stem: 'display',
    property: 'display',
    values: same(
      'block',
      'inline',
      'inline-block',
      'flex',
      'inline-flex',
      'grid',
      'inline-grid',
      'flow-root',
      'contents',
      'none'
    ),
    responsive: true,
  },
  {
    group: 'layout',
    stem: 'pos',
    property: 'position',
    values: same('static', 'relative', 'absolute', 'fixed', 'sticky'),
    responsive: true,
  },
  ...(
    [
      ['inset', 'inset'],
      ['inset-x', 'inset-inline'],
      ['inset-y', 'inset-block'],
      ['top', 'inset-block-start'],
      ['bottom', 'inset-block-end'],
      ['left', 'left'],
      ['right', 'right'],
      ['start', 'inset-inline-start'],
      ['end', 'inset-inline-end'],
    ] as const
  ).map(([stem, property]): UtilityDefinition => ({
    group: 'layout',
    stem,
    property,
    values: { '0': '0', auto: 'auto', full: '100%', half: '50%' },
    responsive: true,
  })),
  {
    group: 'layout',
    stem: 'z',
    property: 'z-index',
    values: {
      '0': '0',
      '1': '1',
      auto: 'auto',
      ...fromTokens('zIndex', keys(scalarTokens.zIndex)),
    },
  },
  ...(['overflow', 'overflow-x', 'overflow-y'] as const).map(
    (stem): UtilityDefinition => ({
      group: 'layout',
      stem,
      property: stem,
      values: same('auto', 'hidden', 'scroll', 'visible', 'clip'),
      responsive: true,
    })
  ),
  {
    group: 'layout',
    stem: 'vis',
    property: 'visibility',
    values: same('visible', 'hidden', 'collapse'),
    responsive: true,
  },
  {
    group: 'layout',
    stem: 'box-sizing',
    property: 'box-sizing',
    values: same('border-box', 'content-box'),
  },
  {
    group: 'layout',
    stem: 'float',
    property: 'float',
    values: same('start', 'end', 'none'),
  },

  // Flexbox.
  {
    group: 'flex',
    stem: 'flex-dir',
    property: 'flex-direction',
    values: {
      row: 'row',
      'row-reverse': 'row-reverse',
      col: 'column',
      'col-reverse': 'column-reverse',
    },
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'flex-wrap',
    property: 'flex-wrap',
    values: same('wrap', 'nowrap', 'wrap-reverse'),
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'flex',
    property: 'flex',
    values: { '1': '1 1 0%', auto: '1 1 auto', initial: '0 1 auto', none: 'none' },
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'flex-grow',
    property: 'flex-grow',
    values: { '0': '0', '1': '1' },
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'flex-shrink',
    property: 'flex-shrink',
    values: { '0': '0', '1': '1' },
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'order',
    property: 'order',
    values: { first: '-9999', last: '9999', '0': '0', ...counts(4, String) },
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'justify-content',
    property: 'justify-content',
    values: { ...same(...alignment), ...spread },
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'justify-items',
    property: 'justify-items',
    values: same(...alignment),
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'justify-self',
    property: 'justify-self',
    values: { ...same(...alignment), auto: 'auto' },
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'align-items',
    property: 'align-items',
    values: { ...same(...alignment), baseline: 'baseline' },
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'align-content',
    property: 'align-content',
    values: { ...same(...alignment), ...spread },
    responsive: true,
  },
  {
    group: 'flex',
    stem: 'align-self',
    property: 'align-self',
    values: { ...same(...alignment), auto: 'auto', baseline: 'baseline' },
    responsive: true,
  },

  // Grid.
  {
    group: 'grid',
    stem: 'grid-template-cols',
    property: 'grid-template-columns',
    values: {
      none: 'none',
      ...counts(6, (n) => `repeat(${n}, minmax(0, 1fr))`),
      '12': 'repeat(12, minmax(0, 1fr))',
    },
    responsive: true,
  },
  {
    group: 'grid',
    stem: 'grid-template-rows',
    property: 'grid-template-rows',
    values: { none: 'none', ...counts(6, (n) => `repeat(${n}, minmax(0, 1fr))`) },
    responsive: true,
  },
  {
    group: 'grid',
    stem: 'grid-col',
    property: 'grid-column',
    values: {
      auto: 'auto',
      full: '1 / -1',
      ...Object.fromEntries(
        Object.entries(counts(6, (n) => `span ${n}`)).map(([n, v]) => [`span-${n}`, v])
      ),
    },
    responsive: true,
  },
  {
    group: 'grid',
    stem: 'grid-row',
    property: 'grid-row',
    values: {
      auto: 'auto',
      full: '1 / -1',
      ...Object.fromEntries(
        Object.entries(counts(6, (n) => `span ${n}`)).map(([n, v]) => [`span-${n}`, v])
      ),
    },
    responsive: true,
  },
  {
    group: 'grid',
    stem: 'grid-auto-flow',
    property: 'grid-auto-flow',
    values: {
      row: 'row',
      col: 'column',
      dense: 'dense',
      'row-dense': 'row dense',
      'col-dense': 'column dense',
    },
  },

  // Text.
  {
    group: 'typography',
    stem: 'text',
    property: 'text-align',
    values: same('start', 'center', 'end', 'justify', 'left', 'right'),
    responsive: true,
  },
  {
    group: 'typography',
    stem: 'text-transform',
    property: 'text-transform',
    values: {
      upper: 'uppercase',
      lower: 'lowercase',
      capitalize: 'capitalize',
      none: 'none',
    },
  },
  {
    group: 'typography',
    stem: 'text-decoration-line',
    property: 'text-decoration-line',
    values: same('underline', 'line-through', 'none'),
    hover: true,
  },
  {
    group: 'typography',
    stem: 'text-wrap',
    property: 'text-wrap',
    values: same('wrap', 'nowrap', 'balance', 'pretty'),
  },
  {
    group: 'typography',
    stem: 'text-overflow',
    property: 'text-overflow',
    values: same('ellipsis', 'clip'),
  },
  {
    group: 'typography',
    stem: 'white-space',
    property: 'white-space',
    values: same('normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces'),
  },
  {
    group: 'typography',
    stem: 'word-break',
    property: 'word-break',
    values: same('normal', 'break-all', 'keep-all'),
  },
  {
    group: 'typography',
    stem: 'overflow-wrap',
    property: 'overflow-wrap',
    values: same('normal', 'break-word', 'anywhere'),
  },
  {
    group: 'typography',
    stem: 'vertical-align',
    property: 'vertical-align',
    values: same('baseline', 'top', 'middle', 'bottom'),
  },
  {
    group: 'typography',
    stem: 'font-weight',
    property: 'font-weight',
    values: fromTokens('fontWeight', keys(scalarTokens.fontWeight)),
  },
  {
    group: 'typography',
    stem: 'font-style',
    property: 'font-style',
    values: same('italic', 'normal'),
  },
  {
    group: 'typography',
    stem: 'font-family',
    property: 'font-family',
    values: fromTokens('font', keys(scalarTokens.font)),
  },
  {
    group: 'typography',
    stem: 'font-variant-numeric',
    property: 'font-variant-numeric',
    values: { tabular: 'tabular-nums', normal: 'normal' },
  },
  {
    group: 'typography',
    stem: 'line-height',
    property: 'line-height',
    values: fromTokens('lineHeight', keys(scalarTokens.lineHeight)),
  },
  {
    group: 'typography',
    stem: 'list-style-type',
    property: 'list-style-type',
    values: same('none', 'disc', 'decimal'),
  },
  {
    group: 'typography',
    stem: 'truncate',
    values: {
      '': { overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' },
    },
  },
  {
    group: 'typography',
    stem: 'line-clamp',
    values: Object.fromEntries(
      Object.entries(counts(4, (n) => String(n))).map(([n]) => [
        n,
        {
          display: '-webkit-box',
          overflow: 'hidden',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': n,
        },
      ])
    ),
  },

  // Borders. Colors come after the sides, so a color wins over a side's default.
  { group: 'border', stem: 'border', values: borderOn('') },
  ...(['top', 'bottom', 'left', 'right', 'inline-start', 'inline-end'] as const).map(
    (side): UtilityDefinition => ({
      group: 'border',
      stem: `border-${{ top: 't', bottom: 'b', left: 'l', right: 'r', 'inline-start': 's', 'inline-end': 'e' }[side]}`,
      values: borderOn(`-${side}`),
    })
  ),
  { group: 'border', stem: 'border-x', values: borderOn('-inline') },
  { group: 'border', stem: 'border-y', values: borderOn('-block') },
  {
    group: 'border',
    stem: 'border-style',
    property: 'border-style',
    values: same('solid', 'dashed', 'dotted', 'none'),
  },
  {
    group: 'border',
    stem: 'radius',
    property: 'border-radius',
    values: fromTokens('radius', keys(scalarTokens.radius)),
  },
  {
    group: 'border',
    stem: 'shadow',
    property: 'box-shadow',
    values: { none: 'none', ...fromTokens('shadow', keys(scalarTokens.shadow)) },
    hover: true,
  },
  { group: 'border', stem: 'outline', property: 'outline', values: { none: 'none' } },

  // Color: every color role, by name.
  { group: 'color', stem: 'color', property: 'color', values: colors, hover: true },
  {
    group: 'color',
    stem: 'bg',
    property: 'background-color',
    values: colors,
    hover: true,
  },
  {
    group: 'color',
    stem: 'border-color',
    property: 'border-color',
    values: colors,
    hover: true,
  },
  // SVG paint: a drawing's fills and strokes in the theme's colors.
  {
    group: 'color',
    stem: 'fill',
    property: 'fill',
    values: { ...colors, none: 'none' },
    hover: true,
  },
  {
    group: 'color',
    stem: 'stroke',
    property: 'stroke',
    values: { ...colors, none: 'none' },
    hover: true,
  },
  {
    group: 'color',
    stem: 'stroke-width',
    property: 'stroke-width',
    values: { '0': '0', '1': '1', '2': '2', '3': '3', '4': '4' },
  },

  // Effects and interaction.
  {
    group: 'effects',
    stem: 'opacity',
    property: 'opacity',
    values: { '0': '0', '25': '0.25', '50': '0.5', '75': '0.75', '100': '1' },
    hover: true,
  },
  {
    group: 'effects',
    stem: 'cursor',
    property: 'cursor',
    values: same('pointer', 'default', 'not-allowed', 'grab', 'text', 'wait'),
  },
  {
    group: 'effects',
    stem: 'pointer-events',
    property: 'pointer-events',
    values: same('none', 'auto'),
  },
  {
    group: 'effects',
    stem: 'user-select',
    property: 'user-select',
    values: same('none', 'text', 'all', 'auto'),
  },
  {
    group: 'effects',
    stem: 'transition',
    values: {
      '': {
        'transition-property':
          'color, background-color, border-color, opacity, box-shadow, translate, scale, rotate',
        'transition-duration': 'var(--greese-duration-normal)',
        'transition-timing-function': 'var(--greese-easing-standard)',
      },
      none: { 'transition-property': 'none' },
    },
  },
]

/** A class the set can write, with where it applies. */
export interface UtilityClass {
  /** The class name, variant included: `md-display-flex`. */
  name: string
  group: UtilityGroup
  /** The class after the variant: `mt`, `display`. */
  stem: string
  /** The value part (`4`, `flex`), or `''` for the stem alone. */
  value: string
  /** `hover`, a breakpoint key, or none. */
  variant?: string
  declarations: Declarations
}

export interface UtilityOptions {
  /** A prefix for every class (`g` gives `g-p-4`), if the project wants one. @default none */
  prefix?: string
  /** Only these groups. @default all */
  groups?: readonly UtilityGroup[]
  /** Breakpoint keys and their min-widths in px: the build's. @default the library's */
  breakpoints?: Readonly<Record<string, number>>
  /** Only classes with these names (purging); undefined writes them all. */
  used?: ReadonlySet<string>
}

const declarationsOf = (
  definition: UtilityDefinition,
  value: string | Declarations
): Declarations => {
  if (typeof value !== 'string') return value
  const properties = [definition.property ?? []].flat()
  return Object.fromEntries(properties.map((property) => [property, value]))
}

/**
 * Every class in the set, in the order they are written: plain, hover, then
 * each breakpoint smallest first, so a larger screen's class beats a smaller
 * one's at equal specificity (mobile first).
 */
export const utilityClasses = ({
  prefix = '',
  groups,
  breakpoints = defaultBreakpoints,
}: UtilityOptions = {}): UtilityClass[] => {
  const variants: Array<string | undefined> = [
    undefined,
    'hover',
    ...Object.entries(breakpoints)
      .filter(([, width]) => width > 0)
      .sort(([, a], [, b]) => a - b)
      .map(([key]) => key),
  ]
  const wanted = definitions.filter((d) => !groups || groups.includes(d.group))
  return variants.flatMap((variant) =>
    wanted
      .filter((d) =>
        variant === undefined ? true : variant === 'hover' ? d.hover : d.responsive
      )
      .flatMap((d) =>
        Object.entries(d.values).map(([value, setting]) => ({
          name: [prefix, variant, d.stem, value].filter(Boolean).join('-'),
          group: d.group,
          stem: d.stem,
          value,
          ...(variant && { variant }),
          declarations: declarationsOf(d, setting),
        }))
      )
  )
}

const rule = (selector: string, declarations: Declarations, indent: string): string =>
  `${indent}${selector} {\n${Object.entries(declarations)
    .map(([property, value]) => `${indent}  ${property}: ${value};`)
    .join('\n')}\n${indent}}`

/**
 * The CSS for the utilities: the layer order, then the classes in
 * `@layer greese.utilities`. With `used`, only those classes (see
 * `purgeUtilities`).
 */
export const generateUtilities = (options: UtilityOptions = {}): string => {
  const { used } = options
  const breakpoints: Readonly<Record<string, number>> =
    options.breakpoints ?? defaultBreakpoints
  const classes = utilityClasses(options).filter(({ name }) => !used || used.has(name))
  const blocks: string[] = []
  const wrap = (variant: string | undefined, body: string[]) => {
    if (!body.length) return
    if (variant === undefined) blocks.push(...body)
    else if (variant === 'hover')
      blocks.push(
        `  @media (hover: hover) {\n${body.map((b) => b.replace(/^/gm, '  ')).join('\n')}\n  }`
      )
    else
      blocks.push(
        `  @media (width >= ${breakpoints[variant]}px) {\n${body.map((b) => b.replace(/^/gm, '  ')).join('\n')}\n  }`
      )
  }
  for (const variant of new Set(classes.map((c) => c.variant)))
    wrap(
      variant,
      classes
        .filter((c) => c.variant === variant)
        .map((c) =>
          rule(`.${c.name}${variant === 'hover' ? ':hover' : ''}`, c.declarations, '  ')
        )
    )
  return `/* GENERATED by @greese/ui from src/utilities.ts - do not edit. */\n${LAYER_ORDER}\n${
    blocks.length ? `@layer greese.utilities {\n${blocks.join('\n')}\n}\n` : ''
  }`
}

/** Every token in some source text that could be a class name. */
export const scanContent = (text: string): Set<string> =>
  new Set(text.match(/[A-Za-z0-9_-]+/g) ?? [])

export interface PurgeOptions extends Omit<UtilityOptions, 'used'> {
  /** Source text to look for class names in: markup, components, templates. */
  content: Iterable<string>
  /** Classes (or patterns) to keep even if the source never spells them out, such as ones built at run time. */
  safelist?: ReadonlyArray<string | RegExp>
}

/**
 * Only the utilities a project uses. A class counts as used when its name
 * appears anywhere in the content, as a whole word, so `class="p-4"`,
 * `className={cx('p-4')}` and a name in a data file all count; one built from
 * pieces (`` `p-${n}` ``) does not, and belongs in `safelist`.
 */
export const purgeUtilities = ({
  content,
  safelist = [],
  ...options
}: PurgeOptions): string => {
  const found = new Set<string>()
  for (const text of content) for (const token of scanContent(text)) found.add(token)
  const names = utilityClasses(options).map((c) => c.name)
  const used = new Set(names.filter((name) => found.has(name)))
  for (const name of names)
    if (safelist.some((s) => (typeof s === 'string' ? s === name : s.test(name))))
      used.add(name)
  return generateUtilities({ ...options, used })
}
