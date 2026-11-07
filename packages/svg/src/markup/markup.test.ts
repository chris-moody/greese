import { describe, expect, it } from 'vitest'
import {
  adoptIds,
  collectIds,
  hoistDefs,
  MarkupError,
  nodeAtOffset,
  parseMarkup,
  renameIds,
  sanitizeMarkup,
  serializeMarkup,
  serializeMarkupWithRanges,
  walkMarkup,
  type MarkupNode,
} from './index.ts'

const icon = `<?xml version="1.0"?>
<!DOCTYPE svg>
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <!-- a star -->
  <path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" fill="url(#g)"/>
  <text x='2' y="20">A &amp; <tspan>B</tspan> &#x43;</text>
</svg>`

/** The tree without editor ids or ranges: what the markup says. */
const shape = (node: MarkupNode): unknown =>
  node.tag[0] === '#'
    ? [node.tag, node.text]
    : [node.tag, node.attrs, node.children.map(shape)]

describe('parseMarkup', () => {
  it('reads elements, attributes, text, comments and entities', () => {
    const root = parseMarkup(icon)
    expect(shape(root)).toEqual([
      'svg',
      { viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' },
      [
        ['#comment', ' a star '],
        ['path', { d: 'M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z', fill: 'url(#g)' }, []],
        [
          'text',
          { x: '2', y: '20' },
          [
            ['#text', 'A & '],
            ['tspan', {}, [['#text', 'B']]],
            ['#text', ' C'],
          ],
        ],
      ],
    ])
  })

  it('records where every node and attribute is', () => {
    const root = parseMarkup(icon)
    const path = root.children[1]!
    expect(icon.slice(path.range!.start, path.range!.end)).toMatch(/^<path .*\/>$/)
    expect(icon.slice(path.attrRanges!.fill!.start, path.attrRanges!.fill!.end)).toBe(
      'fill="url(#g)"'
    )
    const text = root.children[2]!
    expect(icon.slice(text.range!.start, text.range!.end)).toMatch(/^<text.*<\/text>$/)
  })

  it('gives editor ids in document order, or from a generator', () => {
    const root = parseMarkup('<svg><g><rect/></g></svg>')
    expect([...walkMarkup(root)].map((n) => n.id)).toEqual(['n1', 'n2', 'n3'])
    let k = 0
    const custom = parseMarkup('<svg><g/></svg>', { nextId: () => `x${k++}` })
    expect(custom.children[0]!.id).toBe('x1')
  })

  it('keeps CDATA, and whitespace inside text content only', () => {
    const root = parseMarkup(
      '<svg>\n  <style><![CDATA[a{}]]></style>\n  <text> two  spaces </text>\n</svg>'
    )
    expect(root.children.map((c) => c.tag)).toEqual(['style', 'text'])
    expect(root.children[0]!.children[0]).toMatchObject({ tag: '#cdata', text: 'a{}' })
    expect(root.children[1]!.children[0]!.text).toBe(' two  spaces ')
  })

  it('drops comments when asked', () => {
    expect(parseMarkup(icon, { comments: false }).children[0]!.tag).toBe('path')
  })

  it('throws where the markup breaks, with line and column', () => {
    const cases: Array<[string, RegExp]> = [
      ['<svg><g></svg>', /Expected <\/g>, found <\/svg>/],
      ['<svg width=1/>', /quoted value/],
      ['<svg a="1" a="2"/>', /Duplicate attribute a/],
      ['<svg>', /Unclosed <svg>/],
      ['<svg/><g/>', /after the root/],
      ['text', /root element/],
      ['<svg><!-- open', /Unclosed comment/],
    ]
    for (const [source, message] of cases)
      expect(() => parseMarkup(source), source).toThrow(message)
    try {
      parseMarkup('<svg>\n  <g>\n</svg>')
    } catch (error) {
      expect(error).toBeInstanceOf(MarkupError)
      expect(error).toMatchObject({ line: 3, column: 1 })
    }
  })

  it('finds the element a caret is in', () => {
    const source = '<svg><g id="a"><rect id="b"/></g><circle/></svg>'
    const root = parseMarkup(source)
    expect(nodeAtOffset(root, source.indexOf('rect'))!.attrs.id).toBe('b')
    expect(nodeAtOffset(root, source.indexOf('</g>'))!.attrs.id).toBe('a')
    expect(nodeAtOffset(root, source.indexOf('<circle'))!.tag).toBe('circle')
    expect(nodeAtOffset(root, source.length)).toBeUndefined()
  })
})

describe('serializeMarkup', () => {
  it('writes canonical pretty markup that parses back the same', () => {
    const root = parseMarkup(icon)
    const text = serializeMarkup(root)
    expect(text).toBe(
      [
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
        '  <!-- a star -->',
        '  <path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" fill="url(#g)"/>',
        '  <text x="2" y="20">A &amp; <tspan>B</tspan> C</text>',
        '</svg>',
        '',
      ].join('\n')
    )
    expect(shape(parseMarkup(text))).toEqual(shape(root))
  })

  it('minifies, drops comments, and adds a declaration', () => {
    const root = parseMarkup(icon)
    expect(
      serializeMarkup(root, { pretty: false, comments: false, declaration: true })
    ).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" fill="url(#g)"/><text x="2" y="20">A &amp; <tspan>B</tspan> C</text></svg>'
    )
  })

  it('escapes what must be escaped', () => {
    const root = parseMarkup(
      '<svg aria-label="a &quot;b&quot; &lt; c"><title>x &lt; y</title></svg>'
    )
    expect(serializeMarkup(root, { pretty: false })).toBe(
      '<svg aria-label="a &quot;b&quot; &lt; c"><title>x &lt; y</title></svg>'
    )
  })

  it('records where each node lands', () => {
    const root = parseMarkup('<svg><g><rect/></g></svg>')
    const { text, ranges } = serializeMarkupWithRanges(root)
    const rect = root.children[0]!.children[0]!
    const at = ranges.get(rect.id)!
    expect(text.slice(at.start, at.end)).toBe('<rect/>')
    expect(text.slice(ranges.get(root.id)!.start, ranges.get(root.id)!.end)).toBe(
      text.trimEnd()
    )
  })
})

describe('sanitizeMarkup', () => {
  it('strips scripts, handlers, javascript: and outside hrefs, and says so', () => {
    const root = parseMarkup(
      `<svg onload="x()"><script>alert(1)</script><a href="javascript:alert(1)"><rect fill="url(javascript:x)"/></a><use href="#ok"/><use href="https://evil/x.svg#a"/><image href="data:image/png;base64,AA"/><foreignObject/></svg>`
    )
    const { root: clean, notices } = sanitizeMarkup(root)
    const markup = serializeMarkup(clean, { pretty: false })
    expect(markup).toBe(
      '<svg><a><rect/></a><use href="#ok"/><use/><image href="data:image/png;base64,AA"/><foreignObject/></svg>'
    )
    expect(notices.map((n) => `${n.kind}: ${n.what}`)).toEqual([
      'removed: onload on <svg>',
      'removed: <script>',
      'removed: javascript: in href on <a>',
      'removed: javascript: in fill on <rect>',
      'removed: external href on <use>',
      'warning: <foreignObject> holds HTML',
    ])
    // The input is untouched.
    expect(root.attrs.onload).toBe('x()')
  })
})

describe('hoistDefs', () => {
  it('gathers every definition into one <defs>, first, in order', () => {
    const root = parseMarkup(
      `<svg><rect/><defs><linearGradient id="a"/></defs><g><clipPath id="c"/><circle/></g><defs><path id="p"/><style>.x{}</style></defs><style>.y{}</style></svg>`
    )
    const { root: tidy, notices } = hoistDefs(root)
    expect(serializeMarkup(tidy, { pretty: false })).toBe(
      '<svg><defs><linearGradient id="a"/><clipPath id="c"/><path id="p"/><style>.x{}\n.y{}</style></defs><rect/><g><circle/></g></svg>'
    )
    expect(notices.map((n) => n.what)).toEqual([
      '<clipPath> into <defs>',
      '2 <defs> merged into one',
      '2 <style>s merged into one',
    ])
  })

  it('writes no <defs> without definitions', () => {
    const { root } = hoistDefs(parseMarkup('<svg><defs/><rect/></svg>'))
    expect(serializeMarkup(root, { pretty: false })).toBe('<svg><rect/></svg>')
  })
})

describe('renameIds', () => {
  it('renames clashing ids and rewrites every reference', () => {
    const root = parseMarkup(
      `<svg aria-labelledby="t other"><title id="t">Star</title><defs><linearGradient id="g"/><filter id="f"><feBlend in="g" in2="SourceGraphic"/></filter><style>.a{fill:url(#g)} #g{}</style></defs><path id="p" fill="url(#g)" filter="url( #f)" style="stroke:url(#g)"/><use href="#p"/><use xlink:href="#p"/><animate begin="p.click; 2s"/><rect id="gg" fill="url(#gg)"/></svg>`
    )
    const {
      root: moved,
      renamed,
      notices,
    } = renameIds(root, new Set(['g', 'p', 't', 'g-2']))
    expect([...renamed]).toEqual([
      ['t', 't-2'],
      ['g', 'g-3'],
      ['p', 'p-2'],
    ])
    expect(notices[0]).toEqual({ kind: 'moved', what: '#t renamed #t-2' })
    const markup = serializeMarkup(moved, { pretty: false })
    expect(markup).toContain('aria-labelledby="t-2 other"')
    expect(markup).toContain('<linearGradient id="g-3"/>')
    expect(markup).toContain('.a{fill:url(#g-3)} #g-3{}')
    expect(markup).toContain(
      'fill="url(#g-3)" filter="url( #f)" style="stroke:url(#g-3)"'
    )
    expect(markup).toContain('<use href="#p-2"/><use xlink:href="#p-2"/>')
    expect(markup).toContain('begin="p-2.click; 2s"')
    // A result name isn't an id; a longer id isn't a match.
    expect(markup).toContain('in="g" in2="SourceGraphic"')
    expect(markup).toContain('<rect id="gg" fill="url(#gg)"/>')
    expect(collectIds(moved)).toContain('p-2')
  })

  it('leaves a tree without clashes as it was', () => {
    const root = parseMarkup('<svg><g id="a"/></svg>')
    expect(renameIds(root, new Set(['b'])).renamed.size).toBe(0)
  })
})

describe('adoptIds', () => {
  it('keeps the identity of nodes still there after an edit', () => {
    const before = parseMarkup('<svg><rect id="a"/><circle/><g><path/></g></svg>')
    let k = 0
    const after = parseMarkup(
      '<svg><circle r="2"/><rect id="a" x="1"/><g><path/><path/></g></svg>',
      {
        nextId: () => `new${k++}`,
      }
    )
    const adopted = adoptIds(before, after)
    const id = (n: MarkupNode) => n.id
    expect(adopted.id).toBe(before.id)
    const [circle, rect, g] = adopted.children
    expect(rect!.id).toBe(before.children[0]!.id)
    expect(circle!.id).toBe(before.children[1]!.id)
    expect(g!.id).toBe(before.children[2]!.id)
    expect(g!.children.map(id)).toEqual([before.children[2]!.children[0]!.id, 'new5'])
    // The new tree's own values win.
    expect(rect!.attrs.x).toBe('1')
  })
})
