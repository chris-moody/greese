import { walkMarkup, type MarkupNode } from './parse.ts'

/** Something an import changed or flagged: the notice ADR 0037 shows. */
export interface MarkupNotice {
  /** `removed` was taken out; `moved` was hoisted or renamed; `warning` was kept but flagged. */
  kind: 'removed' | 'moved' | 'warning'
  /** What, in words: `<script>`, `onclick on <rect>`, `#a renamed #a-2`. */
  what: string
  /** The editor id of the node it was on, when it's still in the tree. */
  nodeId?: string
}

/** A changed tree, and what changed. */
export interface MarkupResult {
  root: MarkupNode
  notices: MarkupNotice[]
}

/** A deep copy, keeping editor ids. Source ranges go, since the copy isn't that source any more. */
const copy = (node: MarkupNode): MarkupNode => ({
  id: node.id,
  tag: node.tag,
  attrs: { ...node.attrs },
  children: node.children.map(copy),
  ...(node.text !== undefined && { text: node.text }),
})

const localName = (tag: string) => tag.slice(tag.indexOf(':') + 1)
const lower = (name: string) => localName(name).toLowerCase()

/**
 * A value as a URL parser reads it: browsers drop ASCII whitespace and
 * control characters inside a scheme (`java\tscript:`), so the checks do too.
 */
const squash = (value: string) =>
  // eslint-disable-next-line no-control-regex -- control characters are what this removes
  value.replace(/[\u0000-\u0020\u007f]+/g, '').toLowerCase()

/** A script scheme anywhere in a value. */
const runsScript = (value: string) => /(?:javascript|vbscript):/.test(squash(value))

/** `url(…)` targets in a value or a stylesheet. */
const urlTargets = (value: string) =>
  [...value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)].map((m) => squash(m[2] ?? ''))

/** Whether a reference stays in the file: `#id`, or an image's `data:`. */
const inFile = (target: string, imageData: boolean) =>
  target.startsWith('#') || (imageData && target.startsWith('data:image/'))

/** Animations whose target is a link, a handler or a style: they can set what the rest refuses. */
const ANIMATIONS = new Set([
  'animate',
  'set',
  'animatemotion',
  'animatetransform',
  'discard',
])
/** HTML that runs, loads or redirects, inside `<foreignObject>`. */
const HTML_REFUSED = new Set([
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'meta',
  'base',
  'link',
  'form',
  'portal',
  'template',
])
/** HTML attributes that load a URL. */
const HTML_URLS = new Set([
  'src',
  'action',
  'formaction',
  'data',
  'poster',
  'background',
  'ping',
  'cite',
  'longdesc',
  'srcset',
  'codebase',
  'manifest',
])
/** Elements whose `href` may be an image's `data:` URL. */
const IMAGES = new Set(['image', 'feimage', 'img'])

/**
 * Whether a comment could end early once the markup is inlined in HTML,
 * whose comment rules differ from XML's (`--!>`, `<!-->`).
 */
const unsafeComment = (text: string) => /--|[<>]/.test(text) || text.startsWith('-')

/** A stylesheet with `@import` and outside `url()`s taken out. */
const cleanCss = (css: string): { css: string; changed: boolean } => {
  let out = css.replace(/@import[^;]*;?/gi, '')
  out = out.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (whole, _q, target: string) =>
    inFile(squash(target), false) ? whole : 'none'
  )
  return { css: out, changed: out !== css }
}

/**
 * Takes out what could run code or reach outside the file, and says what it
 * took:
 *
 * - `<script>`, `on*` handlers, and `javascript:` or `vbscript:` anywhere;
 * - links and `url()`s that aren't in the file (`#id`, or an image's
 *   `data:`), in attributes and in `<style>`, and `@import`;
 * - animations that would set a link, a handler or a style;
 * - comments that could end early once inlined in HTML.
 *
 * Names are compared by local name and case, so a prefix (`x:href` bound to
 * XLink) or `SCRIPT` doesn't slip by. `<foreignObject>` is kept with a
 * warning, and its HTML gets the same rules, less anything that loads or
 * runs (`iframe`, `object`, `srcdoc`…).
 */
export const sanitizeMarkup = (input: MarkupNode): MarkupResult => {
  const notices: MarkupNotice[] = []
  const clean = (
    node: MarkupNode,
    inHtml: boolean,
    inStyle: boolean
  ): MarkupNode | null => {
    if (node.tag === '#comment') {
      if (!unsafeComment(node.text ?? '')) return copy(node)
      notices.push({ kind: 'removed', what: 'a comment that could end early in HTML' })
      return null
    }
    if (node.tag[0] === '#') {
      if (!inStyle) return copy(node)
      const { css, changed } = cleanCss(node.text ?? '')
      if (changed)
        notices.push({ kind: 'removed', what: '@import or an outside url() in <style>' })
      return { ...copy(node), text: css }
    }
    const name = lower(node.tag)
    if (name === 'script' || (inHtml && HTML_REFUSED.has(name))) {
      notices.push({ kind: 'removed', what: `<${node.tag}>` })
      return null
    }
    if (ANIMATIONS.has(name)) {
      const target = lower(node.attrs.attributeName ?? '')
      if (target === 'href' || target.startsWith('on') || target === 'style') {
        notices.push({
          kind: 'removed',
          what: `<${node.tag}> setting ${node.attrs.attributeName}`,
        })
        return null
      }
    }
    if (name === 'foreignobject')
      notices.push({
        kind: 'warning',
        what: '<foreignObject> holds HTML',
        nodeId: node.id,
      })
    const attrs: Record<string, string> = {}
    for (const [attr, value] of Object.entries(node.attrs)) {
      const what = `${attr} on <${node.tag}>`
      const key = lower(attr)
      const link = key === 'href' || (inHtml && HTML_URLS.has(key))
      if (key.startsWith('on') || (inHtml && key === 'srcdoc'))
        notices.push({ kind: 'removed', what, nodeId: node.id })
      else if (runsScript(value))
        notices.push({
          kind: 'removed',
          what: `a script URL in ${what}`,
          nodeId: node.id,
        })
      else if (link && !inFile(squash(value), IMAGES.has(name)))
        notices.push({ kind: 'removed', what: `external ${what}`, nodeId: node.id })
      else if (urlTargets(value).some((t) => !inFile(t, false)))
        notices.push({
          kind: 'removed',
          what: `an outside url() in ${what}`,
          nodeId: node.id,
        })
      else attrs[attr] = value
    }
    const html = inHtml || name === 'foreignobject'
    const children = node.children
      .map((c) => clean(c, html, name === 'style'))
      .filter((c): c is MarkupNode => !!c)
    return { ...copy({ ...node, children: [] }), attrs, children }
  }
  // A root that's refused leaves an empty drawing, never the root it was.
  const root = clean(input, false, false) ?? {
    id: input.id,
    tag: 'svg',
    attrs: {},
    children: [],
  }
  return { root, notices }
}

/** Definitions: they draw only when referenced, so they belong in `<defs>`. */
export const DEFINITION_TAGS = new Set([
  'linearGradient',
  'radialGradient',
  'pattern',
  'clipPath',
  'mask',
  'marker',
  'symbol',
  'filter',
  'style',
])

/**
 * Gathers every definition into one `<defs>`, the root's first child (ADR
 * 0037): the children of every `<defs>`, and definitions standing elsewhere in
 * the drawing, in document order, ids kept. Several `<style>`s become one.
 * Without definitions, there's no `<defs>`.
 */
export const hoistDefs = (input: MarkupNode): MarkupResult => {
  const notices: MarkupNotice[] = []
  const members: MarkupNode[] = []
  let defsCount = 0

  const gather = (node: MarkupNode, root: boolean): MarkupNode => {
    const children: MarkupNode[] = []
    for (const child of node.children) {
      const name = localName(child.tag)
      if (name === 'defs') {
        defsCount++
        members.push(...child.children.filter((c) => c.tag !== '#text').map(copy))
      } else if (DEFINITION_TAGS.has(name)) {
        // Already a definition: its insides aren't the drawing, so not walked.
        if (!root)
          notices.push({
            kind: 'moved',
            what: `<${child.tag}> into <defs>`,
            nodeId: child.id,
          })
        members.push(copy(child))
      } else children.push(child.tag[0] === '#' ? copy(child) : gather(child, false))
    }
    return { ...copy({ ...node, children: [] }), children }
  }
  const root = gather(input, true)
  if (defsCount > 1)
    notices.push({ kind: 'moved', what: `${defsCount} <defs> merged into one` })

  // One <style>, its rules in order.
  const styles = members.filter((m) => localName(m.tag) === 'style')
  if (styles.length > 1) {
    const first = styles[0]!
    first.children = [
      {
        id: `${first.id}-text`,
        tag: '#text',
        attrs: {},
        children: [],
        text: styles.map((s) => s.children.map((c) => c.text ?? '').join('')).join('\n'),
      },
    ]
    for (const extra of styles.slice(1)) members.splice(members.indexOf(extra), 1)
    notices.push({ kind: 'moved', what: `${styles.length} <style>s merged into one` })
  }
  if (members.length) {
    const existing = input.children.find((c) => localName(c.tag) === 'defs')
    root.children.unshift({
      id: existing?.id ?? `${input.id}-defs`,
      tag: 'defs',
      attrs: existing ? { ...existing.attrs } : {},
      children: members,
    })
  }
  return { root, notices }
}

/** Every `id` attribute in the tree. */
export const collectIds = (root: MarkupNode): Set<string> => {
  const ids = new Set<string>()
  for (const node of walkMarkup(root)) if (node.attrs.id) ids.add(node.attrs.id)
  return ids
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The id-list attributes whose tokens are ids. */
const ID_LISTS = new Set([
  'aria-labelledby',
  'aria-describedby',
  'aria-controls',
  'aria-owns',
  'aria-flowto',
  'aria-activedescendant',
  'aria-details',
  'aria-errormessage',
])

/**
 * Renames ids that clash with `taken` (a document's ids, before pasting into
 * it), and rewrites every reference to them: `url(#…)` in any attribute and
 * in `<style>`, `#id` selectors there, `href` and `xlink:href`, ARIA id lists
 * and SMIL `begin`/`end` (`a.click`). A filter primitive's `in` and `in2` name
 * results inside their filter, not ids, so they stay. New ids are the old one
 * with `-2`, `-3`…, clear of both trees.
 */
export const renameIds = (
  input: MarkupNode,
  taken: ReadonlySet<string>
): MarkupResult & { renamed: Map<string, string> } => {
  const own = collectIds(input)
  const used = new Set([...taken, ...own])
  const renamed = new Map<string, string>()
  for (const id of own) {
    if (!taken.has(id)) continue
    let n = 2
    while (used.has(`${id}-${n}`)) n++
    renamed.set(id, `${id}-${n}`)
    used.add(`${id}-${n}`)
  }
  if (!renamed.size) return { root: copy(input), notices: [], renamed }

  const pattern = new RegExp(
    `#(${[...renamed.keys()].map(escapeRegExp).join('|')})(?![\\w-])`,
    'g'
  )
  const swap = (_: string, id: string) => `#${renamed.get(id)}`
  // Only references move: `url(#id)`, never `#fed`, a colour that happens to match.
  const inUrls = (value: string) =>
    value.replace(/url\(([^)]*)\)/gi, (whole) => whole.replace(pattern, swap))
  // A stylesheet's selectors (what ends at `{`) name ids; its values don't.
  const inCss = (css: string) =>
    css
      .split(/(?<=[{};])/)
      .map((part) => (part.endsWith('{') ? part.replace(pattern, swap) : part))
      .map(inUrls)
      .join('')
  const timing = new RegExp(
    `(^|[\\s;])(${[...renamed.keys()].map(escapeRegExp).join('|')})(?=\\.)`,
    'g'
  )

  const visit = (node: MarkupNode, inStyle: boolean): MarkupNode => {
    if (node.tag === '#text' || node.tag === '#cdata')
      return { ...copy(node), text: inStyle ? inCss(node.text ?? '') : node.text }
    const attrs: Record<string, string> = {}
    for (const [name, value] of Object.entries(node.attrs)) {
      if (name === 'id') attrs[name] = renamed.get(value) ?? value
      else if (ID_LISTS.has(name))
        attrs[name] = value
          .split(/\s+/)
          .map((t) => renamed.get(t) ?? t)
          .join(' ')
      else if (name === 'begin' || name === 'end')
        attrs[name] = value.replace(
          timing,
          (_, lead: string, id: string) => `${lead}${renamed.get(id)}`
        )
      else if (lower(name) === 'href' && value.startsWith('#'))
        attrs[name] = value.replace(pattern, swap)
      else attrs[name] = value.includes('url(') ? inUrls(value) : value
    }
    const style = localName(node.tag) === 'style'
    return {
      ...copy({ ...node, children: [] }),
      attrs,
      children: node.children.map((c) => visit(c, style)),
    }
  }
  const notices: MarkupNotice[] = [...renamed].map(([from, to]) => ({
    kind: 'moved',
    what: `#${from} renamed #${to}`,
  }))
  return { root: visit(input, false), notices, renamed }
}

/**
 * Carries editor ids from an old tree to a new parse of edited code, so nodes
 * that are still there keep their identity (selection, hidden and locked
 * state). Children match by `id` attribute first, then by tag in order.
 */
export const adoptIds = (previous: MarkupNode, next: MarkupNode): MarkupNode => {
  const match = (old: MarkupNode, fresh: MarkupNode): MarkupNode => {
    const pairs = new Map<MarkupNode, MarkupNode>()
    const used = new Set<MarkupNode>()
    // First every `id` attribute, so an element added before an id'd sibling
    // can't take that sibling's identity by position.
    for (const child of fresh.children) {
      if (!child.attrs.id) continue
      const found = old.children.find(
        (c) => !used.has(c) && c.attrs.id === child.attrs.id && c.tag === child.tag
      )
      if (found) {
        pairs.set(child, found)
        used.add(found)
      }
    }
    // Then by tag, in order, among what's left.
    for (const child of fresh.children) {
      if (pairs.has(child)) continue
      const found = old.children.find(
        (c) =>
          !used.has(c) &&
          c.tag === child.tag &&
          !(c.attrs.id && child.attrs.id && c.attrs.id !== child.attrs.id) &&
          !(c.attrs.id && fresh.children.some((f) => f.attrs.id === c.attrs.id))
      )
      if (found) {
        pairs.set(child, found)
        used.add(found)
      }
    }
    const children = fresh.children.map((child) => {
      const found = pairs.get(child)
      return found ? match(found, child) : child
    })
    return { ...fresh, id: old.tag === fresh.tag ? old.id : fresh.id, children }
  }
  return match(previous, next)
}
