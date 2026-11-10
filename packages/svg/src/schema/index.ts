/**
 * `@greese/svg/schema`: what every SVG 2 element is, may hold and takes. One
 * table drives an editor's properties panel, its layer icons, validation and
 * code hints (Shaper's ADR 0037). Pure data and lookups; no DOM.
 */

/** What kind of thing an element is. */
export type ElementCategory =
  | 'container'
  | 'shape'
  | 'graphic'
  | 'text'
  | 'paint'
  | 'definition'
  | 'primitive'
  | 'component'
  | 'light'
  | 'descriptive'
  | 'animation'
  | 'other'

/**
 * Where an editor shows it: `folder` and `layer` in the layers panel (ADR
 * 0037), `library` among the definitions, `none` inside another element's
 * editor (a gradient's stops, a filter's primitives) or not at all.
 */
export type ElementRole = 'folder' | 'layer' | 'library' | 'none'

/** How an attribute's value is read and edited. */
export type AttributeType =
  | 'length'
  | 'lengthList'
  | 'number'
  | 'numberList'
  | 'paint'
  | 'color'
  | 'enum'
  | 'url'
  | 'points'
  | 'pathData'
  | 'transform'
  | 'viewBox'
  | 'preserveAspectRatio'
  | 'href'
  | 'id'
  | 'idList'
  | 'string'

/** One attribute: its type, and an enum's values. */
export interface AttributeSpec {
  name: string
  type: AttributeType
  /** An enum's values. */
  values?: readonly string[]
  /** A presentation attribute: also a CSS property, so `style` can set it. */
  presentation?: boolean
}

/** One element. */
export interface ElementSpec {
  tag: string
  category: ElementCategory
  role: ElementRole
  /** Whether it draws where it stands, rather than only when referenced. */
  renders: boolean
  /** What it may hold: categories and tags, and `#text` for text content. */
  children: readonly string[]
  /** Its attributes, the shared groups included. */
  attributes: readonly AttributeSpec[]
}

type Raw = Record<string, string>

/**
 * Attributes in shorthand: `'x y width height': 'length'`, an enum as
 * `'enum:a|b'`, and a leading `~` marks presentation attributes.
 */
const expand = (raw: Raw): AttributeSpec[] =>
  Object.entries(raw).flatMap(([names, kind]) => {
    const presentation = kind.startsWith('~')
    const [type, list] = kind.replace('~', '').split(':') as [AttributeType, string?]
    return names.split(' ').map((name) => ({
      name,
      type,
      ...(list && { values: list.split('|') }),
      ...(presentation && { presentation }),
    }))
  })

const LINE_CAP = 'enum:butt|round|square'
const UNITS = 'enum:userSpaceOnUse|objectBoundingBox'
const SPREAD = 'enum:pad|reflect|repeat'
const CHANNEL = 'enum:R|G|B|A'
const EDGE = 'enum:duplicate|wrap|none'
const BLEND =
  'normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity'

const CORE: Raw = {
  id: 'id',
  'class lang': 'string',
  style: 'string',
  tabindex: 'number',
  role: 'string',
  'aria-label': 'string',
  'aria-labelledby aria-describedby': 'idList',
  'aria-hidden': 'enum:true|false',
}

const PRESENTATION: Raw = {
  'fill stroke': '~paint',
  'fill-opacity stroke-opacity opacity stroke-miterlimit': '~number',
  'fill-rule clip-rule': '~enum:nonzero|evenodd',
  'stroke-width stroke-dashoffset': '~length',
  'stroke-dasharray': '~lengthList',
  'stroke-linecap': `~${LINE_CAP}`,
  'stroke-linejoin': '~enum:miter|round|bevel|arcs|miter-clip',
  color: '~color',
  display: '~enum:inline|block|none|contents',
  visibility: '~enum:visible|hidden|collapse',
  'clip-path mask filter marker-start marker-mid marker-end': '~url',
  'paint-order': '~string',
  'vector-effect': '~enum:none|non-scaling-stroke',
  'mix-blend-mode': `~enum:${BLEND}`,
  'shape-rendering': '~enum:auto|optimizeSpeed|crispEdges|geometricPrecision',
  'pointer-events':
    '~enum:auto|none|visiblePainted|visibleFill|visibleStroke|visible|painted|fill|stroke|all|bounding-box',
  transform: '~transform',
}

const TEXT_STYLE: Raw = {
  'font-family font-weight text-decoration': '~string',
  'font-size letter-spacing word-spacing': '~length',
  'font-style': '~enum:normal|italic|oblique',
  'text-anchor': '~enum:start|middle|end',
  'dominant-baseline':
    '~enum:auto|text-bottom|alphabetic|ideographic|middle|central|mathematical|hanging|text-top',
  'writing-mode': '~enum:horizontal-tb|vertical-rl|vertical-lr',
}

const PRIMITIVE: Raw = {
  'x y width height': 'length',
  'result in': 'string',
  'color-interpolation-filters': '~enum:auto|sRGB|linearRGB',
}

const TIMING: Raw = {
  'attributeName begin end dur repeatCount repeatDur from to by values keyTimes keySplines':
    'string',
  fill: 'enum:freeze|remove',
  calcMode: 'enum:discrete|linear|paced|spline',
  additive: 'enum:replace|sum',
  accumulate: 'enum:none|sum',
  href: 'href',
}

const BOX: Raw = { 'x y width height': 'length' }
/** SVG 2's geometry properties: settable from CSS too. */
const GEOMETRY: Raw = { 'x y width height': '~length' }
const VIEW: Raw = { viewBox: 'viewBox', preserveAspectRatio: 'preserveAspectRatio' }
const HREF: Raw = { 'href xlink:href': 'href' }
const TEXT_POSITION: Raw = {
  'x y dx dy': 'lengthList',
  rotate: 'numberList',
  textLength: 'length',
  lengthAdjust: 'enum:spacing|spacingAndGlyphs',
}

/** Everything drawable an element may hold. */
const DRAWING = [
  'container',
  'shape',
  'graphic',
  'text',
  'paint',
  'definition',
  'descriptive',
  'animation',
  'other',
]
const SHAPE_CHILDREN = ['descriptive', 'animation']
const TEXT_CHILDREN = ['#text', 'tspan', 'textPath', 'a', 'descriptive', 'animation']
const PRIMITIVE_CHILDREN = ['animate', 'set', 'descriptive']

type Row = [
  category: ElementCategory,
  role: ElementRole,
  renders: boolean,
  children: readonly string[],
  own?: Raw,
]

const ROWS: Record<string, Row> = {
  svg: [
    'container',
    'folder',
    true,
    DRAWING,
    { ...BOX, ...VIEW, 'xmlns xmlns:xlink version': 'string' },
  ],
  g: ['container', 'folder', true, DRAWING],
  // Text as well: an `<a>` inside `<text>` holds words.
  a: [
    'container',
    'folder',
    true,
    [...DRAWING, '#text'],
    { ...HREF, 'target download rel hreflang type': 'string' },
  ],
  switch: ['container', 'folder', true, DRAWING],
  defs: ['container', 'none', false, DRAWING],
  symbol: [
    'definition',
    'library',
    false,
    DRAWING,
    { ...BOX, ...VIEW, 'refX refY': 'length' },
  ],
  marker: [
    'definition',
    'library',
    false,
    DRAWING,
    {
      ...VIEW,
      'refX refY markerWidth markerHeight': 'length',
      markerUnits: 'enum:strokeWidth|userSpaceOnUse',
      orient: 'string',
    },
  ],
  mask: [
    'definition',
    'library',
    false,
    DRAWING,
    { ...BOX, 'maskUnits maskContentUnits': UNITS, 'mask-type': '~enum:luminance|alpha' },
  ],
  clipPath: [
    'definition',
    'library',
    false,
    ['shape', 'text', 'use', 'descriptive', 'animation'],
    { clipPathUnits: UNITS },
  ],
  pattern: [
    'paint',
    'library',
    false,
    DRAWING,
    {
      ...BOX,
      ...VIEW,
      ...HREF,
      'patternUnits patternContentUnits': UNITS,
      patternTransform: 'transform',
    },
  ],
  linearGradient: [
    'paint',
    'library',
    false,
    ['stop', 'animate', 'animateTransform', 'set', 'descriptive'],
    {
      'x1 y1 x2 y2': 'length',
      gradientUnits: UNITS,
      gradientTransform: 'transform',
      spreadMethod: SPREAD,
      ...HREF,
    },
  ],
  radialGradient: [
    'paint',
    'library',
    false,
    ['stop', 'animate', 'animateTransform', 'set', 'descriptive'],
    {
      'cx cy r fx fy fr': 'length',
      gradientUnits: UNITS,
      gradientTransform: 'transform',
      spreadMethod: SPREAD,
      ...HREF,
    },
  ],
  stop: [
    'component',
    'none',
    false,
    ['animate', 'set'],
    { offset: 'number', 'stop-color': '~color', 'stop-opacity': '~number' },
  ],
  rect: [
    'shape',
    'layer',
    true,
    SHAPE_CHILDREN,
    { ...GEOMETRY, 'rx ry': '~length', pathLength: 'number' },
  ],
  circle: [
    'shape',
    'layer',
    true,
    SHAPE_CHILDREN,
    { 'cx cy r': '~length', pathLength: 'number' },
  ],
  ellipse: [
    'shape',
    'layer',
    true,
    SHAPE_CHILDREN,
    { 'cx cy rx ry': '~length', pathLength: 'number' },
  ],
  line: [
    'shape',
    'layer',
    true,
    SHAPE_CHILDREN,
    { 'x1 y1 x2 y2': 'length', pathLength: 'number' },
  ],
  polyline: [
    'shape',
    'layer',
    true,
    SHAPE_CHILDREN,
    { points: 'points', pathLength: 'number' },
  ],
  polygon: [
    'shape',
    'layer',
    true,
    SHAPE_CHILDREN,
    { points: 'points', pathLength: 'number' },
  ],
  path: [
    'shape',
    'layer',
    true,
    SHAPE_CHILDREN,
    { d: '~pathData', pathLength: 'number' },
  ],
  use: ['graphic', 'layer', true, SHAPE_CHILDREN, { ...BOX, ...HREF }],
  image: [
    'graphic',
    'layer',
    true,
    SHAPE_CHILDREN,
    {
      ...BOX,
      ...HREF,
      preserveAspectRatio: 'preserveAspectRatio',
      crossorigin: 'enum:anonymous|use-credentials',
    },
  ],
  foreignObject: ['graphic', 'layer', true, ['#any'], BOX],
  text: ['text', 'layer', true, TEXT_CHILDREN, TEXT_POSITION],
  tspan: ['text', 'none', true, TEXT_CHILDREN, TEXT_POSITION],
  textPath: [
    'text',
    'none',
    true,
    TEXT_CHILDREN,
    {
      ...HREF,
      startOffset: 'length',
      method: 'enum:align|stretch',
      spacing: 'enum:auto|exact',
      side: 'enum:left|right',
      path: 'pathData',
      textLength: 'length',
      lengthAdjust: 'enum:spacing|spacingAndGlyphs',
    },
  ],
  title: ['descriptive', 'none', false, ['#text']],
  desc: ['descriptive', 'none', false, ['#text']],
  metadata: ['descriptive', 'none', false, ['#any']],
  style: ['definition', 'library', false, ['#text'], { 'type media title': 'string' }],
  script: ['other', 'none', false, ['#text'], { type: 'string', ...HREF }],
  view: ['other', 'none', false, ['descriptive'], VIEW],
  filter: [
    'definition',
    'library',
    false,
    ['primitive', 'descriptive', 'animate', 'set'],
    { ...BOX, 'filterUnits primitiveUnits': UNITS },
  ],
  feBlend: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    { in2: 'string', mode: `enum:${BLEND}` },
  ],
  feColorMatrix: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    { type: 'enum:matrix|saturate|hueRotate|luminanceToAlpha', values: 'numberList' },
  ],
  feComponentTransfer: [
    'primitive',
    'none',
    false,
    ['feFuncR', 'feFuncG', 'feFuncB', 'feFuncA'],
  ],
  feComposite: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    {
      in2: 'string',
      operator: 'enum:over|in|out|atop|xor|lighter|arithmetic',
      'k1 k2 k3 k4': 'number',
    },
  ],
  feConvolveMatrix: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    {
      'order kernelMatrix': 'numberList',
      'divisor bias targetX targetY': 'number',
      edgeMode: EDGE,
      preserveAlpha: 'enum:true|false',
    },
  ],
  feDiffuseLighting: [
    'primitive',
    'none',
    false,
    ['light', ...PRIMITIVE_CHILDREN],
    { 'surfaceScale diffuseConstant': 'number', 'lighting-color': '~color' },
  ],
  feSpecularLighting: [
    'primitive',
    'none',
    false,
    ['light', ...PRIMITIVE_CHILDREN],
    {
      'surfaceScale specularConstant specularExponent': 'number',
      'lighting-color': '~color',
    },
  ],
  feDisplacementMap: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    { in2: 'string', scale: 'number', 'xChannelSelector yChannelSelector': CHANNEL },
  ],
  feDropShadow: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    {
      'dx dy': 'number',
      stdDeviation: 'numberList',
      'flood-color': '~color',
      'flood-opacity': '~number',
    },
  ],
  feFlood: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    { 'flood-color': '~color', 'flood-opacity': '~number' },
  ],
  feGaussianBlur: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    { stdDeviation: 'numberList', edgeMode: EDGE },
  ],
  feImage: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    {
      ...HREF,
      preserveAspectRatio: 'preserveAspectRatio',
      crossorigin: 'enum:anonymous|use-credentials',
    },
  ],
  feMerge: ['primitive', 'none', false, ['feMergeNode']],
  feMorphology: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    { operator: 'enum:erode|dilate', radius: 'numberList' },
  ],
  feOffset: ['primitive', 'none', false, PRIMITIVE_CHILDREN, { 'dx dy': 'number' }],
  feTile: ['primitive', 'none', false, PRIMITIVE_CHILDREN],
  feTurbulence: [
    'primitive',
    'none',
    false,
    PRIMITIVE_CHILDREN,
    {
      baseFrequency: 'numberList',
      'numOctaves seed': 'number',
      stitchTiles: 'enum:stitch|noStitch',
      type: 'enum:fractalNoise|turbulence',
    },
  ],
  feMergeNode: ['component', 'none', false, ['animate', 'set'], { in: 'string' }],
  feFuncR: ['component', 'none', false, ['animate', 'set']],
  feFuncG: ['component', 'none', false, ['animate', 'set']],
  feFuncB: ['component', 'none', false, ['animate', 'set']],
  feFuncA: ['component', 'none', false, ['animate', 'set']],
  feDistantLight: [
    'light',
    'none',
    false,
    ['animate', 'set'],
    { 'azimuth elevation': 'number' },
  ],
  fePointLight: ['light', 'none', false, ['animate', 'set'], { 'x y z': 'number' }],
  feSpotLight: [
    'light',
    'none',
    false,
    ['animate', 'set'],
    {
      'x y z pointsAtX pointsAtY pointsAtZ specularExponent limitingConeAngle': 'number',
    },
  ],
  animate: ['animation', 'none', false, ['descriptive']],
  set: ['animation', 'none', false, ['descriptive']],
  discard: ['animation', 'none', false, ['descriptive'], { 'begin href': 'string' }],
  animateTransform: [
    'animation',
    'none',
    false,
    ['descriptive'],
    { type: 'enum:translate|scale|rotate|skewX|skewY' },
  ],
  animateMotion: [
    'animation',
    'none',
    false,
    ['descriptive', 'mpath'],
    { path: 'pathData', keyPoints: 'string', rotate: 'string' },
  ],
  mpath: ['component', 'none', false, ['descriptive'], HREF],
}

/** Each element's tag, in the table's order. */
export const SVG_ELEMENTS: readonly string[] = Object.keys(ROWS)

const TRANSFER: Raw = {
  type: 'enum:identity|table|discrete|linear|gamma',
  tableValues: 'numberList',
  'slope intercept amplitude exponent offset': 'number',
}

/** The shared groups an element takes, by what it is. */
const groupsFor = (tag: string, category: ElementCategory): Raw[] => {
  if (tag.startsWith('feFunc')) return [CORE, TRANSFER]
  switch (category) {
    case 'container':
    case 'shape':
    case 'graphic':
      return [
        CORE,
        PRESENTATION,
        ...(tag === 'svg' || tag === 'g' || tag === 'a' ? [TEXT_STYLE] : []),
      ]
    case 'text':
      return [CORE, PRESENTATION, TEXT_STYLE]
    case 'definition':
    case 'paint':
      return tag === 'style' ? [{ id: 'id' }] : [CORE, PRESENTATION]
    case 'primitive':
      return tag === 'feMergeNode' ? [CORE] : [CORE, PRIMITIVE]
    case 'animation':
      return [CORE, TIMING]
    default:
      return [CORE]
  }
}

const cache = new Map<string, ElementSpec>()

/**
 * An element's spec, its shared attribute groups merged in (its own
 * attributes override a group's of the same name). Namespaced tags read by
 * their local name. `undefined` for an element SVG doesn't define.
 *
 * ```ts
 * elementSpec('rect')!.attributes.find((a) => a.name === 'rx') // { name: 'rx', type: 'length' }
 * ```
 */
export const elementSpec = (tag: string): ElementSpec | undefined => {
  const local = tag.slice(tag.indexOf(':') + 1)
  const hit = cache.get(local)
  if (hit) return hit
  const row = ROWS[local]
  if (!row) return undefined
  const [category, role, renders, children, own = {}] = row
  const byName = new Map<string, AttributeSpec>()
  for (const group of [...groupsFor(local, category), own])
    for (const spec of expand(group)) byName.set(spec.name, spec)
  const spec: ElementSpec = {
    tag: local,
    category,
    role,
    renders,
    children,
    attributes: [...byName.values()],
  }
  cache.set(local, spec)
  return spec
}

/** One attribute's spec on an element, or `undefined` where it doesn't apply. */
export const attributeSpec = (tag: string, name: string): AttributeSpec | undefined =>
  elementSpec(tag)?.attributes.find((a) => a.name === name)

/**
 * Whether `parent` may hold `child` (a tag, or `#text`). Unknown elements
 * hold anything and go anywhere, as browsers let them.
 */
export const canContain = (parent: string, child: string): boolean => {
  const spec = elementSpec(parent)
  if (!spec || spec.children.includes('#any')) return true
  if (child === '#text') return spec.children.includes('#text')
  const inner = elementSpec(child)
  if (!inner) return true
  return spec.children.includes(inner.tag) || spec.children.includes(inner.category)
}
