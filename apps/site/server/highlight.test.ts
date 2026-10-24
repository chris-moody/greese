import { describe, expect, it } from 'vitest'
import { highlight, type Language } from '../src/studio/highlight.ts'

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
})
