/**
 * A block of code in the docs: highlighted in the page's own colours (light
 * and dark, `_palette.scss`, in the docs' shared code folder), with a copy button. TypeScript, JSX and JSON go
 * through Prism (prism-react-renderer, which the live editor uses too); CSS
 * and SCSS through the studio's tokenizer, which knows the kit's syntax.
 */
import { type JSX } from 'react'
import { Highlight, Prism } from 'prism-react-renderer'
import { Code, IconButton, toast } from '@greese/react'
import { CopyIcon } from '@greese/icons'
import {
  highlightCode as highlight,
  type CodeLanguage as Language,
} from '@greese/authoring/core'

const PRISM: Record<string, string> = {
  ts: 'tsx',
  tsx: 'tsx',
  typescript: 'tsx',
  js: 'jsx',
  jsx: 'jsx',
  javascript: 'jsx',
  json: 'json',
  html: 'markup',
  xml: 'markup',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
}

/** Prism's token types, as the studio's token classes. */
const KIND: Record<string, string> = {
  comment: 'comment',
  prolog: 'comment',
  string: 'string',
  char: 'string',
  'template-string': 'string',
  'attr-value': 'string',
  url: 'string',
  number: 'number',
  boolean: 'number',
  keyword: 'keyword',
  'at-rule': 'at',
  important: 'keyword',
  function: 'function',
  'class-name': 'function',
  tag: 'tag',
  'attr-name': 'attribute',
  property: 'property',
  selector: 'selector',
  variable: 'variable',
  constant: 'variable',
  builtin: 'variable',
  punctuation: 'punctuation',
  operator: 'punctuation',
}

const NO_THEME = { plain: {}, styles: [] }

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast({ title: 'Copied', tone: 'positive', duration: 2000 })
  } catch {
    toast({ title: 'Couldn’t copy', description: 'Select the code instead.' })
  }
}

const Tokens = ({ code, language }: { code: string; language: string }): JSX.Element => {
  if (language === 'css' || language === 'scss')
    return (
      <>
        {highlight(code, language as Language).map((token, i) =>
          token.kind ? (
            <span key={i} className={`greese-CodeToken--${token.kind}`}>
              {token.text}
            </span>
          ) : (
            token.text
          )
        )}
      </>
    )
  const prism = PRISM[language]
  if (!prism) return <>{code}</>
  return (
    <Highlight prism={Prism} theme={NO_THEME} code={code} language={prism}>
      {({ tokens }) => (
        <>
          {tokens.map((line, l) => (
            <span key={l}>
              {line.map((token, t) => {
                // The most specific type wins: Prism lists it last.
                const kind = token.types
                  .map((type) => KIND[type])
                  .filter(Boolean)
                  .pop()
                return kind ? (
                  <span key={t} className={`greese-CodeToken--${kind}`}>
                    {token.content}
                  </span>
                ) : (
                  token.content
                )
              })}
              {l < tokens.length - 1 && '\n'}
            </span>
          ))}
        </>
      )}
    </Highlight>
  )
}

export interface CodeBlockProps {
  code: string
  /** `tsx`, `scss`, `bash`…: anything unknown is shown as plain text. */
  language?: string
  /** Leave out the copy button. */
  plain?: boolean
}

export const CodeBlock = ({
  code,
  language = 'tsx',
  plain,
}: CodeBlockProps): JSX.Element => {
  const text = code.replace(/\n$/, '')
  return (
    <div className="docs-code">
      <Code block className="docs-code-block" data-language={language}>
        <Tokens code={text} language={language} />
      </Code>
      {!plain && (
        <IconButton
          size="sm"
          variant="ghost"
          tone="neutral"
          label="Copy code"
          className="docs-code-copy"
          onClick={() => void copy(text)}
        >
          <CopyIcon />
        </IconButton>
      )}
    </div>
  )
}
