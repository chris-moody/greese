import { describe, expect, it } from 'vitest'
import { storybookPath, storybookPort, storybookTarget } from './storybook.ts'

describe('storybook', () => {
  it('reads the port from the docs dev script', () => {
    expect(storybookPort({ scripts: { dev: 'storybook dev -p 6006 --no-open' } })).toBe(
      6006
    )
    expect(storybookPort({ scripts: { dev: 'storybook dev --port=7007' } })).toBe(7007)
    expect(storybookPort({})).toBe(6006)
    // The real one: the redirect follows apps/docs/package.json.
    expect(storybookPort()).toBeGreaterThan(0)
  })

  it('recognises /storybook paths under the base, and nothing else', () => {
    expect(storybookPath('/storybook/?path=/docs/forms-button--docs')).toBe(
      '/?path=/docs/forms-button--docs'
    )
    expect(storybookPath('/storybook')).toBe('/')
    expect(storybookPath('/storybook?path=/docs/x--docs')).toBe('/?path=/docs/x--docs')
    expect(storybookPath('/storybook/iframe.html', '/greese/')).toBeUndefined()
    expect(storybookPath('/greese/storybook/iframe.html', '/greese/')).toBe(
      '/iframe.html'
    )
    expect(storybookPath('/storybooks')).toBeUndefined()
    expect(storybookPath('/studio')).toBeUndefined()
  })

  it('sends the request to Storybook on the host it came to, so a phone follows', () => {
    expect(storybookTarget('localhost:5180', '/?path=/docs/x--docs', 6006)).toBe(
      'http://localhost:6006/?path=/docs/x--docs'
    )
    expect(storybookTarget('192.168.1.5:5180', '/', 6006)).toBe(
      'http://192.168.1.5:6006/'
    )
    expect(storybookTarget('[::1]:5180', '/', 6006)).toBe('http://[::1]:6006/')
    expect(storybookTarget(undefined, '/', 6006)).toBe('http://localhost:6006/')
  })
})
