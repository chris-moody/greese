/**
 * Shape themes: the shape layer of a theme (ADR 0025). A shape theme
 * reassigns the radius roles (`tokens.corner`: which radius each kind of part
 * takes; the radius scale keeps its values), names its shapes
 * (@greese/ui/shapes, ADR 0024), assigns them to components by role, and
 * adds a few structural touches (an accordion's items as separate shapes,
 * Folio's folder tabs) in component SCSS. It sets no colors and no motion: those are the other two layers.
 *
 * Roles keep a theme consistent across the library: every control takes one
 * shape, every container another, and so on. Small controls take smaller
 * features (SHAPE_TARGETS' `scale`), so a cut that suits a button doesn't
 * swallow an icon button.
 *
 * `npm run themes -w site` writes each as `@greese/ui/themes/<id>.scss` and
 * `.css`.
 */
import {
  bevel,
  diamond,
  dogEar,
  hexagon,
  notch,
  slant,
  tabTop,
  tag,
  ticket,
  zigzag,
  type ShapeDef,
  type ShapePoint,
} from '@greese/ui/shapes'
import type { ThemeSpec } from './spec.ts'

export interface ShapePreset {
  id: string
  label: string
  /** What it looks like, in a sentence or two: the theme files' header. */
  description: string
  /** The radius roles it reassigns, for every part not shaped. */
  corner: Record<string, string>
  /** The shapes it adds, by name. */
  shapes: Record<string, ShapeDef>
  /** Which component takes which of them. */
  assign: Record<string, string>
  /** Structural touches, as component SCSS bodies. */
  styles?: Record<string, string>
  /**
   * How the theme menu draws it, for a theme with no clip-path shapes (radii,
   * depth): CSS for a small control. A shaped theme is drawn from its
   * control's own points.
   */
  sample?: Record<string, string>
}

/** The roles a shape theme fills, and the components in each. */
const ROLES = {
  control: ['Button', 'SpeedDial'],
  field: ['Input'],
  container: ['Card', 'Dialog', 'Popover', 'Menu', 'Toast', 'Tile', 'AccordionItem'],
  small: ['Alert', 'Tooltip'],
  indicator: ['Badge', 'Chip', 'Segment', 'SegmentedControl'],
  mark: ['Avatar', 'Status'],
  tab: ['Tab'],
} as const
type Role = keyof typeof ROLES

/** The shapes by role, named `<theme>-<role>`, and every component in the role assigned. */
const byRole = (id: string, shapes: Partial<Record<Role, ShapeDef>>) => ({
  shapes: Object.fromEntries(Object.entries(shapes).map(([role, def]) => [`${id}-${role}`, def])),
  assign: Object.fromEntries(
    Object.keys(shapes).flatMap((role) =>
      ROLES[role as Role].map((component) => [component, `${id}-${role}`])
    )
  ),
})

/**
 * Square corners everywhere, round parts (knobs, radios, markers) included:
 * every role takes the scale's `none`, which stays 0. The scale's own values
 * don't change, so anything that names `--greese-radius-md` still gets 8px.
 */
const NONE = 'var(--greese-radius-none)'
const SQUARE = Object.fromEntries(
  ['control', 'field', 'surface', 'panel', 'inset', 'pill', 'round'].map((role) => [role, NONE])
)

/**
 * Knobs, thumbs and radios turned to diamonds: squared by the radius roles,
 * then a quarter turn, a little smaller so the points fit where the round
 * edge was.
 */
const DIAMOND_KNOBS = {
  Switch: `.greese-Switch-thumb {
  rotate: 45deg;
  scale: 0.8;
}`,
  Slider: `&::-webkit-slider-thumb {
  rotate: 45deg;
  scale: 0.85;
}

&::-moz-range-thumb {
  rotate: 45deg;
  scale: 0.85;
}`,
  Radio: `.greese-Radio-input {
  rotate: 45deg;
  scale: 0.85;
}`,
}

/** An accordion's items, each its own shape, with room between them. */
const ACCORDION = {
  Accordion: `display: grid;
gap: var(--greese-space-2);
border-block-start: 0;`,
  AccordionItem: `padding-inline: var(--greese-space-4);`,
}

/** Zigzag down both short sides: ridged ends, `teeth` a side, `z` deep. */
const ridgedEnds = (z = 4, teeth = 3): ShapeDef => {
  const side = (end: boolean): ShapePoint[] =>
    Array.from({ length: teeth * 2 + 1 }, (_, i) => {
      const k = end ? i : teeth * 2 - i
      const tip = k % 2 === 1
      return {
        x: end
          ? { pct: 100, ...(tip ? {} : { param: 'z', k: -1 }) }
          : { pct: 0, ...(tip ? {} : { param: 'z', k: 1 }) },
        y: { pct: (100 * k) / (teeth * 2) },
      }
    })
  return { points: [...side(true), ...side(false)], params: { z } }
}

/** A zigzag start edge only. */
const ridgedStart = (z = 5, teeth = 6): ShapeDef => ({
  points: [
    { x: { pct: 0, param: 'z', k: 1 }, y: { pct: 0 } },
    { x: { pct: 100 }, y: { pct: 0 } },
    { x: { pct: 100 }, y: { pct: 100 } },
    ...Array.from({ length: teeth * 2 }, (_, i) => {
      const k = teeth * 2 - i
      return {
        x: k % 2 === 1 ? { pct: 0 } : { pct: 0, param: 'z', k: 1 },
        y: { pct: (100 * k) / (teeth * 2) },
      }
    }),
  ],
  params: { z },
  mirror: true,
})

/** A zigzag top edge: a ridged tab. */
const ridgedTop = (z = 3, teeth = 6): ShapeDef => ({
  points: [
    ...Array.from({ length: teeth * 2 + 1 }, (_, k) => ({
      x: { pct: (100 * k) / (teeth * 2) },
      y: k % 2 === 1 ? { pct: 0 } : { pct: 0, param: 'z', k: 1 },
    })),
    { x: { pct: 100 }, y: { pct: 100 } },
    { x: { pct: 0 }, y: { pct: 100 } },
  ],
  params: { z },
})

const BEVEL: ShapePreset = {
  id: 'bevel',
  label: 'Bevel',
  description:
    'Bevel: chamfered corners on two diagonals. Hovered, a control’s cuts slide to the other diagonal; pressed, all four close in. Marks are diamonds, indicators hexagons, tabs trapezoids.',
  corner: SQUARE,
  ...byRole('bevel', {
    control: { ...bevel(8, 0), hover: { a: 0, b: 8 }, active: { a: 4, b: 4 } },
    field: bevel(6, 0),
    container: { ...bevel(16, 0), hover: { a: 0, b: 16 } },
    small: bevel(8, 0),
    indicator: hexagon(6),
    mark: diamond(),
    tab: tabTop(7),
  }),
  styles: { ...ACCORDION, ...DIAMOND_KNOBS },
}

const TICKET: ShapePreset = {
  id: 'ticket',
  label: 'Ticket',
  description:
    'Ticket: square corners, with a round notch punched in each side of containers, fields and tabs; controls and indicators are tags that point onward, and a control’s point stretches when hovered. Marks are notched like stamps.',
  corner: SQUARE,
  ...byRole('ticket', {
    control: { ...tag(10), hover: { t: 15 }, active: { t: 6 } },
    field: ticket(5),
    container: { ...ticket(12), hover: { r: 16 } },
    small: ticket(7),
    indicator: tag(6),
    mark: notch(4),
    tab: ticket(4),
  }),
  styles: ACCORDION,
}

const RIDGE: ShapePreset = {
  id: 'ridge',
  label: 'Ridge',
  description:
    'Ridge: edges cut in ridges, like pinking shears. Containers have a zigzag hem that deepens when a card is hovered, controls and indicators zigzag ends, fields and alerts a zigzag start edge, tabs a zigzag top.',
  corner: SQUARE,
  ...byRole('ridge', {
    control: { ...ridgedEnds(4, 3), hover: { z: 6 }, active: { z: 2 } },
    field: ridgedStart(3, 4),
    container: { ...zigzag(6, 16), hover: { z: 9 } },
    small: ridgedStart(4, 5),
    indicator: ridgedEnds(3, 2),
    mark: diamond(),
    tab: ridgedTop(3, 6),
  }),
  styles: { ...ACCORDION, ...DIAMOND_KNOBS },
}

const FOLIO: ShapePreset = {
  id: 'folio',
  label: 'Folio',
  description:
    'Folio: paper, with square corners. Containers and fields have a dog-eared corner that folds further when a card is hovered; controls and indicators lean like italic type and straighten when hovered. Tab panels are folders, and the current tab opens into its folder.',
  corner: SQUARE,
  ...byRole('folio', {
    control: { ...slant(6), hover: { s: 2 }, active: { s: 0 } },
    field: dogEar(8),
    container: { ...dogEar(18), hover: { f: 28 } },
    small: dogEar(10),
    indicator: slant(4),
    mark: dogEar(8),
  }),
  styles: {
    ...ACCORDION,
    // Folder tabs: the panel is the folder (a frame on the canvas), the
    // list's rule is its top edge, drawn inside the list so the current tab,
    // on the same canvas, can cover it and open into the panel.
    // (On Tabs, not TabPanel: a motion theme styles how panels' content arrives.)
    Tabs: `gap: 0;

> .greese-TabPanel {
  padding: var(--greese-space-4);
  background-color: var(--greese-color-canvas);
  border: 1px solid var(--greese-color-border);
  border-block-start: 0;
}`,
    TabList: `border-block-end: 0;
box-shadow: inset 0 -1px 0 var(--greese-color-border);`,
    // Every tab has a border, transparent until it's the current one, so
    // nothing moves when the selection does.
    Tab: `border: 1px solid transparent;
border-block-end: 0;
border-radius: 0;

&[aria-selected='true'] {
  background-color: var(--greese-color-canvas);
  border-color: var(--greese-color-border);
  box-shadow: none;
}`,
  },
}

/** A radius role pointed at a step of the scale. */
const r = (step: string) => `var(--greese-radius-${step})`

/** An accordion whose items are separate rounded panels, with room between them. */
const ROUNDED_ACCORDION = (corner: string) => ({
  Accordion: `display: grid;
gap: var(--greese-space-2);
border-block-start: 0;`,
  AccordionItem: `padding-inline: var(--greese-space-4);
border: 1px solid var(--greese-color-border);
border-radius: ${corner};`,
})

const SOFT: ShapePreset = {
  id: 'soft',
  label: 'Soft',
  description:
    'Soft: every corner rounded, a step rounder than the library. Controls and fields take the large radius, containers the extra-large one, accordion items are rounded panels and the off-canvas sidebar rounds its inner edge.',
  corner: {
    control: r('lg'),
    field: r('lg'),
    surface: r('xl'),
    panel: r('lg'),
    inset: r('md'),
    pill: r('pill'),
    round: r('round'),
  },
  shapes: {},
  assign: {},
  styles: {
    ...ROUNDED_ACCORDION('var(--greese-corner-panel)'),
    Sidebar: `border-start-end-radius: var(--greese-corner-surface);
border-end-end-radius: var(--greese-corner-surface);`,
  },
  sample: { borderRadius: '6px' },
}

const PEBBLE: ShapePreset = {
  id: 'pebble',
  label: 'Pebble',
  description:
    'Pebble: as round as things get. Every control, field, tab, badge and tooltip is a pill, so square ones (icon buttons, checkboxes, avatars) are circles; containers take the extra-large radius, and a multi-line field the same, not a pill.',
  corner: {
    control: r('pill'),
    field: r('pill'),
    surface: r('xl'),
    panel: r('xl'),
    inset: r('pill'),
    pill: r('pill'),
    round: r('round'),
  },
  shapes: {},
  assign: {},
  styles: {
    ...ROUNDED_ACCORDION('var(--greese-corner-surface)'),
    // A pill on a box of several lines is a stadium that cuts into the text.
    Textarea: `border-radius: var(--greese-radius-xl);`,
  },
  sample: { borderRadius: '999px' },
}

/**
 * Depth drawn inside the box, never past it: inset bands, so a mask (a
 * motion theme's wipe or pocket) or a clip never cuts it off, and nothing
 * moves the layout. Raised parts have a darker band along the bottom and a
 * highlight along the top; recessed ones a shadow along the top.
 */
const RAISED = (depth: string) =>
  `inset 0 1px 0 0 color-mix(in oklab, white 22%, transparent), inset 0 calc(-1 * ${depth}) 0 0 color-mix(in oklab, black 24%, transparent)`
const RECESSED = 'inset 0 0.1875rem 0 0 color-mix(in oklab, var(--greese-color-fg) 10%, transparent)'
/** What a pressed part does: sinks by most of its band (a transform, so it never fights an effect's translate). */
const SINK = (by: string) => `@include greese.motion-safe {
  transition:
    transform var(--greese-duration-fast) var(--greese-easing-standard),
    box-shadow var(--greese-duration-fast) var(--greese-easing-standard),
    background-color var(--greese-duration-fast) var(--greese-easing-standard),
    border-color var(--greese-duration-fast) var(--greese-easing-standard),
    color var(--greese-duration-fast) var(--greese-easing-standard);
}

&:active:not(:disabled, [aria-disabled='true']) {
  transform: translateY(${by});
}`

const EXTRUDE: ShapePreset = {
  id: 'extrude',
  label: 'Extrude',
  description:
    'Extrude: solid, like keycaps. Buttons, chips, badges, keys and avatars stand out of the page on a thick lower edge and sink into it when pressed; cards and tiles are blocks with a deep lower edge; fields, tracks and the segmented control are pressed into the page. All of it drawn inside each box, so it survives every motion theme’s masks.',
  corner: {
    control: r('md'),
    field: r('sm'),
    surface: r('md'),
    panel: r('md'),
    inset: r('sm'),
    pill: r('pill'),
    round: r('round'),
  },
  shapes: {},
  assign: {},
  styles: {
    Button: `&:not(.greese-Button--ghost) {
  box-shadow: ${RAISED('0.25rem')};

  &:active:not(:disabled, [aria-disabled='true']) {
    box-shadow: ${RAISED('0.0625rem')};
  }
}

${SINK('0.1875rem')}`,
    Chip: `box-shadow: ${RAISED('0.1875rem')};

${SINK('0.125rem')}`,
    Badge: `box-shadow: ${RAISED('0.125rem')};`,
    Key: `box-shadow: ${RAISED('0.1875rem')};`,
    Avatar: `box-shadow: ${RAISED('0.1875rem')};`,
    // Blocks: a deep lower edge, and the edge's outline drawn in, not cast.
    Card: `box-shadow: inset 0 0 0 1px var(--greese-color-border), ${RAISED('0.375rem')};`,
    Tile: `box-shadow: inset 0 0 0 1px var(--greese-color-border), ${RAISED('0.375rem')};`,
    Input: `box-shadow: ${RECESSED};`,
    Select: `box-shadow: ${RECESSED};`,
    Textarea: `box-shadow: ${RECESSED};`,
    Progress: `box-shadow: ${RECESSED};`,
    SegmentedControl: `box-shadow: ${RECESSED};`,
  },
  sample: {
    borderRadius: '3px',
    background: 'color-mix(in oklab, currentcolor 40%, transparent)',
    boxShadow: 'inset 0 -5px 0 0 currentcolor',
  },
}

/**
 * Real perspective, on interaction only: nothing rests turned, so a motion
 * theme's entrances (which may turn things too) start and end where the
 * element sits. A `transform`, beside the `translate`, `rotate` and `scale`
 * effects animate, so they compose.
 */
const TURNS = (hover: string, press: string, origin = '50% 50%') => `transform-origin: ${origin};

@include greese.motion-safe {
  transition:
    transform var(--greese-duration-normal) var(--greese-easing-standard),
    background-color var(--greese-duration-fast) var(--greese-easing-standard),
    border-color var(--greese-duration-fast) var(--greese-easing-standard),
    box-shadow var(--greese-duration-normal) var(--greese-easing-standard),
    color var(--greese-duration-fast) var(--greese-easing-standard);

  @media (hover: hover) {
    &:hover:not(:disabled, [aria-disabled='true']) {
      transform: ${hover};
    }
  }

  &:active:not(:disabled, [aria-disabled='true']) {
    transform: ${press};
  }
}`

const TILT: ShapePreset = {
  id: 'tilt',
  label: 'Tilt',
  description:
    'Tilt: real perspective. Hovered, buttons and chips lean back toward you from their lower edge and cards and tiles turn and lift off the page; pressed, they push into it. The current tab stands up off its list. Softer corners than the library’s.',
  corner: {
    control: r('lg'),
    field: r('md'),
    surface: r('lg'),
    panel: r('lg'),
    inset: r('md'),
    pill: r('pill'),
    round: r('round'),
  },
  shapes: {},
  assign: {},
  styles: {
    Button: TURNS(
      'perspective(24rem) rotateX(18deg) translateZ(0.25rem)',
      'perspective(24rem) translateZ(-0.75rem)',
      '50% 100%'
    ),
    Chip: TURNS('perspective(20rem) rotateX(18deg)', 'perspective(20rem) translateZ(-0.5rem)', '50% 100%'),
    Card: `&.greese-Card--interactive {
  ${TURNS('perspective(60rem) rotateX(5deg) rotateY(-7deg) translateZ(1rem)', 'perspective(60rem) translateZ(-0.5rem)')
    .split('\n')
    .join('\n  ')}
}`,
    Tile: TURNS('perspective(50rem) rotateX(6deg) rotateY(-8deg) translateZ(0.75rem)', 'perspective(50rem) translateZ(-0.5rem)'),
    // The current tab leans out of the list toward you, from its foot.
    Tab: `transform-origin: 50% 100%;

@include greese.motion-safe {
  transition:
    transform var(--greese-duration-normal) var(--greese-easing-standard),
    color var(--greese-duration-fast) var(--greese-easing-standard),
    background-color var(--greese-duration-fast) var(--greese-easing-standard),
    box-shadow var(--greese-duration-fast) var(--greese-easing-standard);

  &[aria-selected='true'] {
    transform: perspective(16rem) rotateX(-14deg);
  }
}`,
  },
  sample: { borderRadius: '5px', transform: 'perspective(40px) rotateX(28deg)' },
}

export const SHAPES: ShapePreset[] = [BEVEL, TICKET, RIDGE, FOLIO, SOFT, PEBBLE, EXTRUDE, TILT]

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The shape theme a theme wears: its radius roles, every shape as written, assigned as it assigns them. */
export const shapeIn = (spec: ThemeSpec): ShapePreset | undefined =>
  SHAPES.find(
    (preset) =>
      same(spec.tokens?.corner, preset.corner) &&
      Object.entries(preset.shapes).every(([name, def]) => same(spec.shapes?.[name], def)) &&
      Object.entries(preset.assign).every(([c, name]) => spec.components?.[c]?.shape === name)
  )

/** The theme without any shape theme: their radius roles, shapes, assignments and styles go; everything else stays. */
export const withoutShapes = (spec: ThemeSpec): ThemeSpec => {
  const ours = new Set(SHAPES.flatMap((p) => Object.keys(p.shapes)))
  const theirStyles = new Set(SHAPES.flatMap((p) => Object.values(p.styles ?? {})))
  const shapes = Object.fromEntries(
    Object.entries(spec.shapes ?? {}).filter(([name]) => !ours.has(name))
  )
  const components = Object.fromEntries(
    Object.entries(spec.components ?? {}).flatMap(([name, c]) => {
      const next = { ...c }
      if (next.shape && ours.has(next.shape)) delete next.shape
      if (next.scss && theirStyles.has(next.scss)) delete next.scss
      return Object.keys(next).length ? [[name, next]] : []
    })
  )
  const corner = SHAPES.some((p) => same(spec.tokens?.corner, p.corner))
  const { corner: _corner, ...tokens } = spec.tokens ?? {}
  const { shapes: _drop, ...base } = spec
  return {
    ...base,
    tokens: corner ? tokens : spec.tokens,
    components,
    ...(Object.keys(shapes).length && { shapes }),
  }
}

/** A shape theme in place of any other; colors, motion and other shapes and styles stay. */
export const applyShape = (spec: ThemeSpec, preset: ShapePreset | undefined): ThemeSpec => {
  const base = withoutShapes(spec)
  if (!preset) return base
  const components = { ...base.components }
  for (const [name, shape] of Object.entries(preset.assign))
    components[name] = { ...components[name], shape }
  for (const [name, scss] of Object.entries(preset.styles ?? {}))
    components[name] = { ...components[name], scss }
  return {
    ...base,
    tokens: { ...base.tokens, corner: { ...preset.corner } },
    shapes: { ...base.shapes, ...structuredClone(preset.shapes) },
    components,
  }
}

/** A theme of only a shape theme: what its files hold. */
export const shapeOnlySpec = (preset: ShapePreset): ThemeSpec => applyShape({}, preset)
