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
  control: ['Button'],
  field: ['Input', 'Select', 'Textarea', 'OtpField'],
  container: ['Card', 'Dialog', 'Popover', 'Menu', 'Toast', 'Tile', 'AccordionItem'],
  small: ['Alert', 'Tooltip', 'Collapsible'],
  indicator: ['Badge', 'Chip', 'Segment', 'SegmentedControl'],
  mark: ['Avatar', 'Status'],
  tab: ['Tab'],
} as const
type Role = keyof typeof ROLES

/** The shapes by role, named `<theme>-<role>`, and every component in the role assigned. */
const byRole = (id: string, shapes: Partial<Record<Role, ShapeDef>>) => ({
  shapes: Object.fromEntries(
    Object.entries(shapes).map(([role, def]) => [`${id}-${role}`, def])
  ),
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
  ['control', 'field', 'surface', 'panel', 'inset', 'pill', 'round'].map((role) => [
    role,
    NONE,
  ])
)

/**
 * Knobs, thumbs and radios turned to diamonds: squared by the radius roles,
 * then a quarter turn, a little smaller so the points fit where the round
 * edge was. A switch's track comes to a point at each end too, its sides at
 * the knob's angle, so the knob sits in the point. The track is drawn behind
 * the input, not clipped from it, so the input keeps its focus ring and its
 * touch target.
 */
const DIAMOND_KNOBS = {
  Switch: `.greese-Switch-track::before {
  position: absolute;
  inset: 0;
  content: '';
  background-color: var(--greese-color-border-strong);
  clip-path: polygon(0 50%, 0.625rem 0, calc(100% - 0.625rem) 0, 100% 50%, calc(100% - 0.625rem) 100%, 0.625rem 100%);
  transition: background-color var(--greese-duration-fast) var(--greese-easing-standard);
}

.greese-Switch-track:has(.greese-Switch-input:checked)::before {
  background-color: var(--greese-color-primary);
}

.greese-Switch-input,
.greese-Switch-input:checked {
  background-color: transparent;
}

.greese-Switch-thumb {
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
  // A square turned a quarter is √2 as wide: at 0.7 its points stay inside
  // the radio's box, so a scroller's edge never cuts them off.
  Radio: `.greese-Radio-input {
  rotate: 45deg;
  scale: 0.7;
}`,
}

/**
 * An accordion's items apart, its rules between them gone: the headers are
 * bars of their own (COLLAPSIBLE), so the gap separates them. Where the
 * panels aren't shaped, this is all an accordion takes.
 */
const SPACED_ACCORDION = {
  Accordion: `display: grid;
gap: var(--greese-space-2);
border-block-start: 0;`,
  AccordionItem: 'border-block-end: 0;',
}

/**
 * An accordion's items apart, with room between them: each header is a
 * Collapsible's bar, and each panel takes the item's shape. The <details>
 * itself draws nothing, and its header and panel bring their own room.
 */
const ACCORDION = {
  Accordion: SPACED_ACCORDION.Accordion,
  AccordionItem: `border-block-end: 0;

> .greese-Collapsible-content {
  padding-block-start: var(--greese-space-3);
}`,
}

/**
 * A collapsible's header as a bar of its own, so a theme's shape has
 * something to draw: a surface, a border, room inside, and a gap under it
 * while open. Every shape theme has it; their shapes and depth go on top.
 */
const COLLAPSIBLE = `> .greese-Collapsible-trigger {
  padding-inline: var(--greese-space-4);
  background-color: var(--greese-color-surface);
  border: 1px solid var(--greese-collapsible-border, var(--greese-color-border));
  border-radius: var(--greese-corner-control);

  @media (hover: hover) {
    &:hover {
      background-color: color-mix(in oklab, var(--greese-color-fg) 5%, var(--greese-color-surface));
    }
  }
}

&[open] > .greese-Collapsible-trigger {
  margin-block-end: var(--greese-space-2);
}

> .greese-Collapsible-content {
  padding-inline: var(--greese-space-4);
}`

/**
 * A chat bubble's outline, its tail included (`t` out past the box at the
 * bottom start, as the bubble draws it), so a clip keeps the tail: corners
 * cut by `c` but the one the tail leaves from.
 */
const bubbleBevel = (c = 8, t = 11): ShapeDef => ({
  points: [
    { x: { pct: 0, param: 'c', k: 1 }, y: { pct: 0 } },
    { x: { pct: 100, param: 'c', k: -1 }, y: { pct: 0 } },
    { x: { pct: 100 }, y: { pct: 0, param: 'c', k: 1 } },
    { x: { pct: 100 }, y: { pct: 100, param: 'c', k: -1 } },
    { x: { pct: 100, param: 'c', k: -1 }, y: { pct: 100 } },
    { x: { pct: 0, px: -t }, y: { pct: 100 } },
    { x: { pct: 0 }, y: { pct: 100, px: -t } },
    { x: { pct: 0 }, y: { pct: 0, param: 'c', k: 1 } },
  ],
  params: { c },
  mirror: true,
})

/** A chat bubble with a dog-eared top end (`f`) and its tail. */
const bubbleFolio = (f = 10, t = 11): ShapeDef => ({
  points: [
    { x: { pct: 0 }, y: { pct: 0 } },
    { x: { pct: 100, param: 'f', k: -1 }, y: { pct: 0 } },
    { x: { pct: 100 }, y: { pct: 0, param: 'f', k: 1 } },
    { x: { pct: 100 }, y: { pct: 100 } },
    { x: { pct: 0, px: -t }, y: { pct: 100 } },
    { x: { pct: 0 }, y: { pct: 100, px: -t } },
  ],
  params: { f },
  mirror: true,
})

/** A square with every corner cut by `pct` of its side: an avatar's bevel, whatever its size. */
const octagon = (pct = 22): ShapeDef => ({
  points: [
    { x: { pct }, y: { pct: 0 } },
    { x: { pct: 100 - pct }, y: { pct: 0 } },
    { x: { pct: 100 }, y: { pct } },
    { x: { pct: 100 }, y: { pct: 100 - pct } },
    { x: { pct: 100 - pct }, y: { pct: 100 } },
    { x: { pct }, y: { pct: 100 } },
    { x: { pct: 0 }, y: { pct: 100 - pct } },
    { x: { pct: 0 }, y: { pct } },
  ],
})

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

const bevelRoles = byRole('bevel', {
  control: { ...bevel(8, 0), hover: { a: 0, b: 8 }, active: { a: 4, b: 4 } },
  field: bevel(6, 0),
  container: { ...bevel(16, 0), hover: { a: 0, b: 16 } },
  small: bevel(8, 0),
  indicator: hexagon(6),
  mark: diamond(),
  tab: tabTop(7),
})

const BEVEL: ShapePreset = {
  id: 'bevel',
  label: 'Bevel',
  description:
    'Bevel: chamfered corners on two diagonals. Hovered, a control’s cuts slide to the other diagonal; pressed, all four close in. Avatars are squares with every corner cut, status dots diamonds, indicators hexagons, tabs trapezoids, and chat bubbles cut at every corner but their tail’s.',
  corner: SQUARE,
  shapes: {
    ...bevelRoles.shapes,
    'bevel-avatar': octagon(22),
    'bevel-bubble': bubbleBevel(8),
  },
  assign: { ...bevelRoles.assign, Avatar: 'bevel-avatar', ChatBubble: 'bevel-bubble' },
  styles: { ...ACCORDION, ...DIAMOND_KNOBS, Collapsible: COLLAPSIBLE },
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
  styles: { ...ACCORDION, Collapsible: COLLAPSIBLE },
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
  styles: { ...ACCORDION, ...DIAMOND_KNOBS, Collapsible: COLLAPSIBLE },
}

const folioRoles = byRole('folio', {
  control: { ...slant(6), hover: { s: 2 }, active: { s: 0 } },
  field: dogEar(8),
  container: { ...dogEar(18), hover: { f: 28 } },
  small: dogEar(10),
  indicator: slant(4),
  mark: dogEar(8),
})

const FOLIO: ShapePreset = {
  id: 'folio',
  label: 'Folio',
  description:
    'Folio: paper, with square corners. Containers and fields have a dog-eared corner that folds further when a card is hovered; controls and indicators lean like italic type and straighten when hovered. Status dots have a fold to their size, chat bubbles a dog-ear opposite their tail. Tab panels are folders, and the current tab opens into its folder.',
  corner: SQUARE,
  shapes: {
    ...folioRoles.shapes,
    // A dot is a few pixels across: a mark's fold would eat it.
    'folio-dot': dogEar(3),
    'folio-bubble': bubbleFolio(10),
  },
  assign: { ...folioRoles.assign, Status: 'folio-dot', ChatBubble: 'folio-bubble' },
  styles: {
    ...ACCORDION,
    Collapsible: COLLAPSIBLE,
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

/** As ACCORDION, each panel a rounded box of its own. */
const ROUNDED_ACCORDION = (corner: string) => ({
  ...ACCORDION,
  AccordionItem: `border-block-end: 0;

> .greese-Collapsible-content {
  padding-block-start: var(--greese-space-3);
  border: 1px solid var(--greese-color-border);
  border-radius: ${corner};
}`,
})

/** A speed dial's round buttons as rounded squares: the trigger's radius, then the actions'. */
const ROUNDED_DIAL = (trigger: string, action: string) => `.greese-SpeedDial-trigger {
  border-radius: ${trigger};
}

.greese-SpeedDialAction-icon {
  border-radius: ${action};
}`

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
    Collapsible: COLLAPSIBLE,
    // Rounded squares, not circles.
    Avatar: `border-radius: var(--greese-radius-lg);`,
    SpeedDial: ROUNDED_DIAL('var(--greese-radius-xl)', 'var(--greese-radius-lg)'),
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
    Collapsible: COLLAPSIBLE,
  },
  sample: { borderRadius: '999px' },
}

/**
 * Depth drawn inside the box, never past it: inset bands, so a mask (a
 * motion theme's wipe or pocket) or a clip never cuts it off, and nothing
 * moves the layout. Raised parts have a darker band along the bottom and a
 * highlight along the top; recessed ones a shadow along the top.
 */
const RAISED = (depth: string, edge = 'color-mix(in oklab, black 24%, transparent)') =>
  `inset 0 1px 0 0 color-mix(in oklab, white 22%, transparent), inset 0 calc(-1 * ${depth}) 0 0 ${edge}`

/**
 * A raised part's lower edge in a shade of its own face that keeps 3:1
 * against it (WCAG 1.4.11), so the depth shows on any face: darker where a
 * darker shade can get there, lighter on a face too dark for that (a black
 * button's edge was black on black). In linear sRGB the face's luminance is
 * exact, and both moves stay in gamut and land on it: darker scales the
 * channels, lighter mixes toward white. A face that isn't opaque (a soft or
 * outline button over the page) keeps the plain darker band, which reads
 * against the page through it. Relative colors with math are recent: the
 * declaration sits behind @supports, the plain band stays the fallback.
 */
const FACE_EDGE = (face: string) => {
  const ratio = 3.1
  const y = '(0.2126 * r + 0.7152 * g + 0.0722 * b)'
  const darker = `((${y} + 0.05) / ${ratio} - 0.05)`
  const lighter = `min(1, ${ratio} * (${y} + 0.05) - 0.05)`
  // 1 where a darker shade can reach the ratio, else 0.
  const dark = `clamp(0, ${darker} * 1000000, 1)`
  const scale = `max(0, ${darker}) / max(0.0001, ${y})`
  const toWhite = `(${lighter} - ${y}) / max(0.0001, 1 - ${y})`
  const opaque = 'clamp(0, (alpha - 0.98) * 100, 1)'
  const channel = (c: string) =>
    `calc(${opaque} * (${dark} * ${c} * ${scale} + (1 - ${dark}) * (${c} + (1 - ${c}) * ${toWhite})))`
  return `color(from ${face} srgb-linear ${channel('r')} ${channel('g')} ${channel('b')} / calc(0.24 + ${opaque} * 0.76))`
}
const FACE_EDGE_SUPPORT =
  '(color: color(from red srgb-linear calc(r * 1) g b / calc(alpha * 1)))'
const RECESSED =
  'inset 0 0.1875rem 0 0 color-mix(in oklab, var(--greese-color-fg) 10%, transparent)'
/** Raised the other way up: the thick edge along the top, as a tab stands up out of its list. */
const RAISED_TOP = (depth: string) =>
  `inset 0 -1px 0 0 color-mix(in oklab, white 22%, transparent), inset 0 ${depth} 0 0 color-mix(in oklab, black 22%, transparent)`
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
    'Extrude: solid, like keycaps. Buttons, chips, badges, keys, avatars, collapsible headers and the chosen segment stand out of the page on a thick lower edge and sink into it when pressed; tabs stand up on a thick top edge and the current one is pressed in; cards, tiles and alerts are blocks with a deep lower edge, an alert’s in its tone; fields, code boxes, tracks and the segmented control are pressed into the page, and a progress bar’s fill stands up out of its track. All of it drawn inside each box, so it survives every motion theme’s masks.',
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

  @supports ${FACE_EDGE_SUPPORT} {
    --greese-button-edge: ${FACE_EDGE('var(--greese-button-bg)')};

    box-shadow: ${RAISED('0.25rem', 'var(--greese-button-edge)')};

    &:active:not(:disabled, [aria-disabled='true']) {
      box-shadow: ${RAISED('0.0625rem', 'var(--greese-button-edge)')};
    }
  }
}

${SINK('0.1875rem')}`,
    Chip: `box-shadow: ${RAISED('0.1875rem')};

${SINK('0.125rem')}`,
    Badge: `box-shadow: ${RAISED('0.125rem')};`,
    Key: `box-shadow: ${RAISED('0.1875rem')};`,
    // Rounded squares, like the keys.
    Avatar: `border-radius: var(--greese-radius-md);
box-shadow: ${RAISED('0.1875rem')};`,
    SpeedDial: ROUNDED_DIAL('var(--greese-radius-lg)', 'var(--greese-radius-md)'),
    // A block whose lower edge is its tone, deeper.
    Alert: `box-shadow:
  inset 0 1px 0 0 color-mix(in oklab, white 22%, transparent),
  inset 0 -0.25rem 0 0 color-mix(in oklab, var(--greese-alert-tone) 40%, transparent);
padding-block-end: calc(var(--greese-space-3) + 0.25rem);`,
    // Keys standing up out of the list, the thick edge along the top; the
    // current one is pressed in (and keeps a color variant's ring).
    Tab: `background-color: var(--greese-color-surface);
border-radius: var(--greese-corner-control) var(--greese-corner-control) 0 0;
box-shadow: ${RAISED_TOP('0.25rem')};
padding-block-start: 0.25rem;

&[aria-selected='true'] {
  background-color: var(--greese-tab-current-bg, color-mix(in oklab, var(--greese-color-primary) 12%, var(--greese-color-canvas)));
  box-shadow:
    inset 0 0 0 1.5px var(--greese-tab-current-ring, transparent),
    inset 0 -2px 0 var(--greese-color-primary),
    ${RECESSED};
  transform: translateY(0.125rem);
}

${SINK('0.125rem')}`,
    ...SPACED_ACCORDION,
    Collapsible: `${COLLAPSIBLE}

> .greese-Collapsible-trigger {
  border-color: transparent;
  box-shadow: inset 0 0 0 1px var(--greese-color-border), ${RAISED('0.25rem')};
  ${SINK('0.1875rem').split('\n').join('\n  ')}
}

&[open] > .greese-Collapsible-trigger {
  box-shadow: inset 0 0 0 1px var(--greese-color-border), ${RAISED('0.0625rem')};
}`,
    // Blocks: a deep lower edge, and the edge's outline drawn in, not cast.
    Card: `box-shadow: inset 0 0 0 1px var(--greese-color-border), ${RAISED('0.375rem')};`,
    Tile: `box-shadow: inset 0 0 0 1px var(--greese-color-border), ${RAISED('0.375rem')};`,
    Input: `box-shadow: ${RECESSED};`,
    Select: `box-shadow: ${RECESSED};`,
    Textarea: `box-shadow: ${RECESSED};`,
    OtpField: `.greese-OtpField-slot {
  box-shadow: ${RECESSED};
}`,
    // A recessed track, its fill standing up out of it.
    Progress: `box-shadow: ${RECESSED};

&::-webkit-progress-value {
  box-shadow: ${RAISED('max(1px, var(--greese-progress-height) / 3)')};
}

&::-moz-progress-bar {
  box-shadow: ${RAISED('max(1px, var(--greese-progress-height) / 3)')};
}`,
    // The track pressed in, the chosen segment a key standing in it (with a
    // color variant's ring, if any). Room in the track for the key's edge.
    SegmentedControl: `.greese-SegmentedControl-track {
  padding: 0.25rem;
  box-shadow: ${RECESSED};
}`,
    Segment: `&:has(:checked) {
  box-shadow:
    inset 0 0 0 1.5px var(--greese-segment-current-ring, transparent),
    ${RAISED('0.1875rem')};
}

${SINK('0.125rem')}`,
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
const TURNS = (
  hover: string,
  press: string,
  origin = '50% 50%'
) => `transform-origin: ${origin};

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
    ...SPACED_ACCORDION,
    Collapsible: COLLAPSIBLE,
    Button: TURNS(
      'perspective(24rem) rotateX(18deg) translateZ(0.25rem)',
      'perspective(24rem) translateZ(-0.75rem)',
      '50% 100%'
    ),
    Chip: TURNS(
      'perspective(20rem) rotateX(18deg)',
      'perspective(20rem) translateZ(-0.5rem)',
      '50% 100%'
    ),
    Card: `&.greese-Card--interactive {
  ${TURNS(
    'perspective(60rem) rotateX(5deg) rotateY(-7deg) translateZ(1rem)',
    'perspective(60rem) translateZ(-0.5rem)'
  )
    .split('\n')
    .join('\n  ')}
}`,
    Tile: TURNS(
      'perspective(50rem) rotateX(6deg) rotateY(-8deg) translateZ(0.75rem)',
      'perspective(50rem) translateZ(-0.5rem)'
    ),
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

export const SHAPES: ShapePreset[] = [
  BEVEL,
  TICKET,
  RIDGE,
  FOLIO,
  SOFT,
  PEBBLE,
  EXTRUDE,
  TILT,
]

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The shape theme a theme wears: its radius roles, every shape as written, assigned as it assigns them. */
export const shapeIn = (spec: ThemeSpec): ShapePreset | undefined =>
  SHAPES.find(
    (preset) =>
      same(spec.tokens?.corner, preset.corner) &&
      Object.entries(preset.shapes).every(([name, def]) =>
        same(spec.shapes?.[name], def)
      ) &&
      Object.entries(preset.assign).every(
        ([c, name]) => spec.components?.[c]?.shape === name
      )
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
export const applyShape = (
  spec: ThemeSpec,
  preset: ShapePreset | undefined
): ThemeSpec => {
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
