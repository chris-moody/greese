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
const isHref = (name: string) => name === 'href' || name === 'xlink:href'

/**
 * Takes out what could run code or reach outside the file, and says what it
 * took: `<script>` elements, `on*` handlers, `javascript:` URLs anywhere, and
 * `href`s that aren't in-document (`#id`) or an image's `data:`. Keeps
 * `<foreignObject>`, with a warning: its HTML is the page's to trust.
 */
export const sanitizeMarkup = (input: MarkupNode): MarkupResult => {
  const notices: MarkupNotice[] = []
  const clean = (node: MarkupNode): MarkupNode | null => {
    if (node.tag[0] === '#') return { ...node, attrs: {}, children: [] }
    const name = localName(node.tag)
    if (name === 'script') {
      notices.push({ kind: 'removed', what: '<script>' })
      return null
    }
    if (name === 'foreignObject')
      notices.push({
        kind: 'warning',
        what: '<foreignObject> holds HTML',
        nodeId: node.id,
      })
    const attrs: Record<string, string> = {}
    for (const [attr, value] of Object.entries(node.attrs)) {
      const what = `${attr} on <${node.tag}>`
      if (/^on/i.test(attr)) notices.push({ kind: 'removed', what, nodeId: node.id })
      else if (
        /^\s*javascript:/i.test(value) ||
        /url\(\s*['"]?\s*javascript:/i.test(value)
      )
        notices.push({ kind: 'removed', what: `javascript: in ${what}`, nodeId: node.id })
      else if (
        isHref(attr) &&
        !value.startsWith('#') &&
        !(name === 'image' && /^data:image\//i.test(value))
      )
        notices.push({ kind: 'removed', what: `external ${what}`, nodeId: node.id })
      else attrs[attr] = value
    }
    const children = node.children.map(clean).filter((c): c is MarkupNode => !!c)
    return { ...copy({ ...node, children: [] }), attrs, children }
  }
  return { root: clean(input) ?? copy({ ...input, children: [] }), notices }
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
  const rewrite = (value: string) =>
    value.replace(pattern, (_, id: string) => `#${renamed.get(id)}`)
  const timing = new RegExp(
    `(^|[\\s;])(${[...renamed.keys()].map(escapeRegExp).join('|')})(?=\\.)`,
    'g'
  )

  const visit = (node: MarkupNode, inStyle: boolean): MarkupNode => {
    if (node.tag === '#text' || node.tag === '#cdata')
      return { ...copy(node), text: inStyle ? rewrite(node.text ?? '') : node.text }
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
      else attrs[name] = value.includes('#') ? rewrite(value) : value
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
    const byAttr = new Map(
      old.children.filter((c) => c.attrs.id).map((c) => [c.attrs.id!, c])
    )
    const used = new Set<MarkupNode>()
    const children = fresh.children.map((child) => {
      let found = child.attrs.id ? byAttr.get(child.attrs.id) : undefined
      if (found && (found.tag !== child.tag || used.has(found))) found = undefined
      found ??= old.children.find(
        (c) =>
          !used.has(c) &&
          c.tag === child.tag &&
          !(c.attrs.id && child.attrs.id && c.attrs.id !== child.attrs.id)
      )
      if (!found) return child
      used.add(found)
      return match(found, child)
    })
    return { ...fresh, id: old.tag === fresh.tag ? old.id : fresh.id, children }
  }
  return match(previous, next)
}
