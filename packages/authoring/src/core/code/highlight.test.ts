import { describe, expect, it } from 'vitest'
import {
  highlightCode,
  splitLines,
  splitTokens,
  type CodeLanguage as Language,
} from './highlight.ts'

const highlight = highlightCode

const kinds = (text: string, language: Language) =>
  highlight(text, language)
    .filter((t) => t.kind)
    .map((t) => [t.kind, t.text])

describe('highlight', () => {
  it('always joins back into the same text', () => {
    const samples: Array<[string, Language]> = [
      [
        '.a:hover > .b[open]::before { color: red; /* x */ margin: 0 auto !important; }',
        'css',
      ],
      ['@media (width >= 900px) { .a { b: var(--c, 1rem) } }\n', 'css'],
      [
        '$gap: 1rem; // note\n.a { &:hover { gap: $gap; width: calc(100% - #{$gap}); } @include x(1px); }',
        'scss',
      ],
      ["{ opacity: [0, 1], y: ['1rem', 0], /* c */ rotate: -2.5e1 }", 'js'],
      ['.broken { color: "unclosed', 'css'],
      ['', 'css'],
    ]
    for (const [text, language] of samples)
      expect(
        highlight(text, language)
          .map((t) => t.text)
          .join(''),
        text
      ).toBe(text)
  })

  it('colours selectors, properties, values and punctuation in css', () => {
    expect(kinds('.a:hover > .b { color: red; gap: var(--x, 1rem); }', 'css')).toEqual([
      ['selector', '.a'],
      ['pseudo', ':hover'],
      ['punctuation', '>'],
      ['selector', '.b'],
      ['punctuation', '{'],
      ['property', 'color'],
      ['punctuation', ':'],
      ['punctuation', ';'],
      ['property', 'gap'],
      ['punctuation', ':'],
      ['function', 'var'],
      ['punctuation', '('],
      ['variable', '--x'],
      ['punctuation', ','],
      ['number', '1rem'],
      ['punctuation', ')'],
      ['punctuation', ';'],
      ['punctuation', '}'],
    ])
  })

  it('knows at-rules, comments, numbers with units, colors and !important', () => {
    const found = kinds(
      '@media (width >= 900px) { .a { b: #fff 2px !important; /* hi */ } }',
      'css'
    )
    expect(found).toContainEqual(['at', '@media'])
    expect(found).toContainEqual(['number', '900px'])
    expect(found).toContainEqual(['number', '#fff'])
    expect(found).toContainEqual(['number', '2px'])
    expect(found).toContainEqual(['keyword', '!important'])
    expect(found).toContainEqual(['comment', '/* hi */'])
  })

  it('reads scss: variables, line comments, nesting, &', () => {
    const found = kinds('$gap: 1rem; // note\n.a { &:hover { gap: $gap; } }', 'scss')
    expect(found).toContainEqual(['variable', '$gap'])
    expect(found).toContainEqual(['comment', '// note'])
    expect(found).toContainEqual(['keyword', '&'])
    expect(found).toContainEqual(['pseudo', ':hover'])
    // `//` is a comment in scss, not in a css url.
    expect(
      kinds('.a { b: url(http://x/y) }', 'scss').some(([k]) => k === 'comment')
    ).toBe(false)
  })

  it('reads effect code: keys, numbers, strings, comments', () => {
    const found = kinds("{ opacity: [0, 1], y: ['1rem', 0] } // c", 'js')
    expect(found).toContainEqual(['property', 'opacity'])
    expect(found).toContainEqual(['number', '0'])
    expect(found).toContainEqual(['string', "'1rem'"])
    expect(found).toContainEqual(['comment', '// c'])
  })

  it('reads typescript: keywords, types, generics, decorators', () => {
    const source = [
      "import { configureBreakpoints, type Breakpoints } from '@greese/react'",
      'export interface Theme { name?: string; sizes: Record<string, number> }',
      'const formats = configureBreakpoints<Breakpoints>({ md: 900 }) satisfies void',
    ].join('\n')
    expect(
      highlight(source, 'ts')
        .map((t) => t.text)
        .join('')
    ).toBe(source)
    const found = kinds(source, 'ts')
    for (const word of [
      'import',
      'type',
      'from',
      'export',
      'interface',
      'string',
      'satisfies',
    ])
      expect(found, word).toContainEqual(['keyword', word])
    expect(found).toContainEqual(['function', 'Breakpoints'])
    expect(found).toContainEqual(['function', 'Record'])
    expect(found).toContainEqual(['function', 'configureBreakpoints'])
    expect(found).toContainEqual(['property', 'name'])
    expect(found).toContainEqual(['string', "'@greese/react'"])
    // A keyword inside a longer name is part of the name.
    expect(found).not.toContainEqual(['keyword', 'for'])
    expect(kinds('@sealed class A {}', 'ts')).toContainEqual(['at', '@sealed'])
    // JavaScript doesn't know TypeScript's words.
    expect(kinds('let type = 1', 'js')).not.toContainEqual(['keyword', 'type'])
  })

  it('reads xml: tags, attributes, values, comments, declarations and entities', () => {
    const source = [
      '<?xml version="1.0"?>',
      '<!-- a star -->',
      '<svg viewBox="0 0 24 24" xmlns:x="u">',
      '  <path d=\'M0 0Z\' fill="none"/>',
      '  <text>A &amp; B<![CDATA[ <raw> ]]></text>',
      '</svg>',
    ].join('\n')
    expect(
      highlight(source, 'xml')
        .map((t) => t.text)
        .join('')
    ).toBe(source)
    const found = kinds(source, 'xml')
    expect(found).toContainEqual(['at', '<?xml version="1.0"?>'])
    expect(found).toContainEqual(['comment', '<!-- a star -->'])
    expect(found).toContainEqual(['tag', 'svg'])
    expect(found).toContainEqual(['attribute', 'viewBox'])
    expect(found).toContainEqual(['attribute', 'xmlns:x'])
    expect(found).toContainEqual(['string', '"0 0 24 24"'])
    expect(found).toContainEqual(['string', "'M0 0Z'"])
    expect(found).toContainEqual(['punctuation', '/>'])
    expect(found).toContainEqual(['number', '&amp;'])
    expect(found).toContainEqual(['string', '<![CDATA[ <raw> ]]>'])
    expect(found).toContainEqual(['punctuation', '</'])
  })

  it('keeps unclosed xml whole', () => {
    for (const text of ['<svg width="1', '<!-- open', '<a b', 'a < b & c'])
      expect(
        highlight(text, 'xml')
          .map((t) => t.text)
          .join('')
      ).toBe(text)
  })
})

describe('splitTokens', () => {
  it('cuts runs at a range’s edges', () => {
    const tokens = highlightCode('<a b="1"/>', 'xml')
    const [before, inside, after] = splitTokens(tokens, { start: 3, end: 8 })
    const join = (list: { text: string }[]) => list.map((t) => t.text).join('')
    expect([join(before), join(inside), join(after)]).toEqual(['<a ', 'b="1"', '/>'])
    expect(inside).toEqual([
      { text: 'b', kind: 'attribute' },
      { text: '=', kind: 'punctuation' },
      { text: '"1"', kind: 'string' },
    ])
  })

  it('clamps a range past the text', () => {
    const [before, inside, after] = splitTokens([{ text: 'abc' }], { start: 1, end: 99 })
    expect([before, inside, after]).toEqual([[{ text: 'a' }], [{ text: 'bc' }], []])
  })
})

describe('splitLines', () => {
  it('cuts tokens at newlines, keeping their kind and part', () => {
    const lines = splitLines([
      [{ text: 'a\nb', kind: 'comment' }],
      [{ text: 'c\n' }],
      [{ text: 'd' }],
    ])
    expect(lines).toEqual([
      [[{ text: 'a', kind: 'comment' }], [], []],
      [[{ text: 'b', kind: 'comment' }], [{ text: 'c' }], []],
      [[], [], [{ text: 'd' }]],
    ])
  })

  it('has a line more than newlines', () => {
    expect(splitLines([[{ text: '\n' }]])).toEqual([
      [[], [], []],
      [[], [], []],
    ])
  })
})
