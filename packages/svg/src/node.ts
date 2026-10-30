/** An attribute value; `undefined` and `false` leave the attribute out. */
export type AttributeValue = string | number | boolean | undefined

/**
 * An SVG element as data: what the builders here return, so one description
 * becomes markup (`toMarkup`), DOM (`toElement`), or a framework's elements.
 * Attribute names are SVG's own (`stop-color`, `stdDeviation`).
 */
export interface SvgNode {
  tag: string
  attrs: Record<string, AttributeValue>
  children: SvgNode[]
}

/** Describes an element: `node('circle', { r: 4 })`. */
export const node = (
  tag: string,
  attrs: Record<string, AttributeValue> = {},
  children: readonly SvgNode[] = []
): SvgNode => ({ tag, attrs, children: [...children] })

/** `url(#id)`, for `fill`, `stroke`, `filter`, `clip-path` and `mask`. */
export const url = (id: string): string => `url(#${id})`

const SVG_NS = 'http://www.w3.org/2000/svg'

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const entries = (attrs: SvgNode['attrs']) =>
  Object.entries(attrs).filter(
    (entry): entry is [string, string | number | true] =>
      entry[1] !== undefined && entry[1] !== false
  )

/** A node as SVG markup, for server rendering or `innerHTML`. */
export const toMarkup = (n: SvgNode): string => {
  const attrs = entries(n.attrs)
    .map(([k, v]) => ` ${k}="${escape(v === true ? '' : String(v))}"`)
    .join('')
  return n.children.length
    ? `<${n.tag}${attrs}>${n.children.map(toMarkup).join('')}</${n.tag}>`
    : `<${n.tag}${attrs}/>`
}

/** A node as a DOM element, in the SVG namespace. */
export const toElement = (n: SvgNode, doc: Document = document): SVGElement => {
  const el = doc.createElementNS(SVG_NS, n.tag) as SVGElement
  for (const [k, v] of entries(n.attrs)) el.setAttribute(k, v === true ? '' : String(v))
  for (const child of n.children) el.append(toElement(child, doc))
  return el
}

/**
 * Adds definitions (gradients, filters, clip paths, masks) to an `<svg>`'s
 * `<defs>`, creating it if needed. An existing element with the same `id`
 * is replaced, so calling it again updates in place. Returns the elements.
 */
export const define = (svg: SVGSVGElement, ...nodes: SvgNode[]): SVGElement[] => {
  const doc = svg.ownerDocument
  let defs = svg.querySelector(':scope > defs')
  if (!defs) {
    defs = doc.createElementNS(SVG_NS, 'defs')
    svg.prepend(defs)
  }
  return nodes.map((n) => {
    const el = toElement(n, doc)
    const id = n.attrs.id
    const existing = id === undefined ? null : defs.querySelector(`[id="${String(id)}"]`)
    if (existing) existing.replaceWith(el)
    else defs.append(el)
    return el
  })
}
