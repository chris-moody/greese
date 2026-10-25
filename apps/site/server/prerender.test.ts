import { describe, expect, it } from 'vitest'
import { withRoot } from './prerender.ts'

describe('prerender', () => {
  it("puts the app's HTML in the empty root, and only there", () => {
    const page =
      '<body><div id="root"></div><script type="module" src="/x.js"></script></body>'
    expect(withRoot(page, '<h1>Hi</h1>')).toBe(
      '<body><div id="root"><h1>Hi</h1></div><script type="module" src="/x.js"></script></body>'
    )
  })

  it('fails the build rather than ship a page it could not fill', () => {
    expect(() => withRoot('<div id="app"></div>', '<h1>Hi</h1>')).toThrow(
      /no <div id="root">/
    )
  })
})
