/**
 * The Markdown TSDoc descriptions are written in, as React elements: what the
 * library's comments use (paragraphs, lists, fenced code, `code`, **bold**,
 * *emphasis* and links), no more. Built from text, never set as HTML.
 */
import type { JSX, ReactNode } from 'react'
import { Code } from '@greese/react'
import { CodeBlock } from './CodeBlock.tsx'
import { DocsLink } from './DocsLink.tsx'

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)\s]+\))/

/** One line or paragraph's inline syntax. */
export const inline = (text: string): ReactNode[] => {
  const out: ReactNode[] = []
  let rest = text
  let key = 0
  while (rest) {
    const match = INLINE.exec(rest)
    if (!match) {
      out.push(rest)
      break
    }
    if (match.index) out.push(rest.slice(0, match.index))
    const [token, code, bold, em, link] = match
    if (code) out.push(<Code key={key++}>{code.slice(1, -1)}</Code>)
    else if (bold) out.push(<strong key={key++}>{inline(bold.slice(2, -2))}</strong>)
    else if (em) out.push(<em key={key++}>{inline(em.slice(1, -1))}</em>)
    else if (link) {
      const [, label, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(link)!
      out.push(
        <DocsLink key={key++} href={href!}>
          {inline(label!)}
        </DocsLink>
      )
    }
    rest = rest.slice(match.index + token.length)
  }
  return out
}

type Block =
  | { kind: 'code'; language: string; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'paragraph'; text: string }

/** Splits Markdown into blocks: fences, lists (items may wrap), paragraphs. */
export const blocks = (markdown: string): Block[] => {
  const out: Block[] = []
  const lines = markdown.replace(/\r/g, '').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const fence = /^\s*```(\w*)/.exec(line)
    if (fence) {
      const body: string[] = []
      while (++i < lines.length && !/^\s*```/.test(lines[i]!)) body.push(lines[i]!)
      out.push({ kind: 'code', language: fence[1] || 'tsx', text: body.join('\n') })
      continue
    }
    const item = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(line)
    if (item) {
      const ordered = /\d/.test(item[1]!)
      const last = out.at(-1)
      const list =
        last?.kind === 'list' && last.ordered === ordered
          ? last
          : (out[out.push({ kind: 'list', ordered, items: [] }) - 1] as Block & {
              kind: 'list'
            })
      list.items.push(item[2]!)
      // An item's next lines, indented, continue it.
      while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1]!))
        list.items[list.items.length - 1] += ` ${lines[++i]!.trim()}`
      continue
    }
    if (!line.trim()) continue
    const last = out.at(-1)
    if (last?.kind === 'paragraph' && lines[i - 1]?.trim()) last.text += ` ${line.trim()}`
    else out.push({ kind: 'paragraph', text: line.trim() })
  }
  return out
}

export const Markdown = ({ children }: { children: string }): JSX.Element => (
  <>
    {blocks(children).map((block, i) =>
      block.kind === 'code' ? (
        <CodeBlock key={i} code={block.text} language={block.language} />
      ) : block.kind === 'list' ? (
        (() => {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{inline(item)}</li>
              ))}
            </List>
          )
        })()
      ) : (
        <p key={i}>{inline(block.text)}</p>
      )
    )}
  </>
)

/** One line of Markdown with no blocks: a props table's cell, a link's label. */
export const InlineMarkdown = ({ children }: { children: string }): JSX.Element => (
  <>{inline(children)}</>
)
