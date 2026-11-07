import { TEXT_CONTENT, type MarkupNode, type SourceRange } from './parse.ts'

export interface SerializeMarkupOptions {
  /** One element per line, indented; `false` writes it all on one line. @default true */
  pretty?: boolean
  /** The indent for each level. @default '  ' */
  indent?: string
  /** Writes comments. @default true */
  comments?: boolean
  /** Starts with `<?xml version="1.0" encoding="UTF-8"?>`. @default false */
  declaration?: boolean
}

/** The markup, and where each node landed in it, by editor id. */
export interface SerializedMarkup {
  text: string
  ranges: Map<string, SourceRange>
}

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

const escapeText = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Writes a tree as markup, recording where each node lands so a code view
 * can light what a canvas selects. Canonical: double quotes, attributes in
 * their order, empty elements self-closed, and, when pretty, one element per
 * line. An element holding text keeps its children on its line, as written,
 * so text's spacing is never changed.
 */
export const serializeMarkupWithRanges = (
  root: MarkupNode,
  options: SerializeMarkupOptions = {}
): SerializedMarkup => {
  const { pretty = true, indent = '  ', comments = true, declaration = false } = options
  const ranges = new Map<string, SourceRange>()
  let out = declaration
    ? `<?xml version="1.0" encoding="UTF-8"?>${pretty ? '\n' : ''}`
    : ''

  const write = (node: MarkupNode, depth: number, inline: boolean) => {
    const start = out.length
    if (node.tag === '#text') out += escapeText(node.text ?? '')
    else if (node.tag === '#cdata') out += `<![CDATA[${node.text ?? ''}]]>`
    else if (node.tag === '#comment') {
      if (!comments) return
      out += `<!--${node.text ?? ''}-->`
    } else {
      out += `<${node.tag}`
      for (const [name, value] of Object.entries(node.attrs))
        out += ` ${name}="${escapeAttr(value)}"`
      const children = comments
        ? node.children
        : node.children.filter((c) => c.tag !== '#comment')
      if (!children.length) out += '/>'
      else {
        out += '>'
        // Text inside: keep everything on the line, exactly as it is.
        const flow =
          inline ||
          !pretty ||
          TEXT_CONTENT.has(node.tag) ||
          children.some((c) => c.tag === '#text' || c.tag === '#cdata')
        for (const child of children) {
          if (!flow) out += `\n${indent.repeat(depth + 1)}`
          write(child, depth + 1, flow)
        }
        if (!flow) out += `\n${indent.repeat(depth)}`
        out += `</${node.tag}>`
      }
    }
    ranges.set(node.id, { start, end: out.length })
  }

  write(root, 0, false)
  return { text: pretty ? `${out}\n` : out, ranges }
}

/**
 * Writes a tree as markup: pretty by default, or minified with
 * `pretty: false`. Editor ids never reach it.
 *
 * ```ts
 * serializeMarkup(root, { pretty: false, comments: false })
 * ```
 */
export const serializeMarkup = (
  root: MarkupNode,
  options?: SerializeMarkupOptions
): string => serializeMarkupWithRanges(root, options).text
