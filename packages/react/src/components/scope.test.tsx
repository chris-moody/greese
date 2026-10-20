import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveGreese } from '../utils/greese.ts'
import { applyScopes, clearScope, holdUntilVisible } from './Motion/scope.ts'
import { Stack } from './Stack/Stack.tsx'
import { Text } from './Text/Text.tsx'

afterEach(cleanup)

const html = (markup: string): HTMLElement => {
  const root = document.createElement('div')
  root.innerHTML = markup
  document.body.append(root)
  return root
}
const at = (el: Element | null) =>
  (el as HTMLElement).style.getPropertyValue('--greese-motion-scope')

const SCOPE = 'greese-Motion greese-Motion--scope'
const ENTER = 'greese-Motion greese-Motion--enter'

describe('applyScopes', () => {
  it('starts entrances in document order, across depth, stagger apart', () => {
    const root = html(`
      <section id="s" class="${SCOPE}">
        <p id="a" class="${ENTER}"></p>
        <div><p id="b" class="${ENTER}"></p></div>
        <p id="c" class="${ENTER}"></p>
        <p id="plain"></p>
      </section>`)
    const s = root.querySelector<HTMLElement>('#s')!
    applyScopes([{ el: s, scope: { stagger: 0.1, delay: 0.5 } }])
    expect(['a', 'b', 'c'].map((id) => at(root.querySelector(`#${id}`)))).toEqual([
      '0.5s',
      '0.6s',
      '0.7s',
    ])
    expect(at(root.querySelector('#plain'))).toBe('')
    // `true` takes the defaults.
    applyScopes([{ el: s, scope: true }])
    expect(at(root.querySelector('#b'))).toBe('0.08s')
  })

  it('leaves scroll reveals to their own trigger', () => {
    const root = html(`
      <div id="s" class="${SCOPE}">
        <p id="a" class="${ENTER}"></p>
        <p id="v" class="greese-Motion greese-Motion--view"></p>
        <p id="b" class="${ENTER}"></p>
      </div>`)
    applyScopes([{ el: root.querySelector<HTMLElement>('#s')!, scope: { stagger: 1 } }])
    expect(at(root.querySelector('#v'))).toBe('')
    expect(at(root.querySelector('#b'))).toBe('1s')
  })

  it('takes a scope inside a scope as one position, and starts its members there', () => {
    const root = html(`
      <div id="outer" class="${SCOPE}">
        <p id="a" class="${ENTER}"></p>
        <div id="inner" class="${SCOPE}">
          <p id="x" class="${ENTER}"></p>
          <p id="y" class="${ENTER}"></p>
        </div>
        <p id="b" class="${ENTER}"></p>
      </div>`)
    // Given out of order: the outer scope is still handled first.
    applyScopes([
      { el: root.querySelector<HTMLElement>('#inner')!, scope: { stagger: 0.05 } },
      { el: root.querySelector<HTMLElement>('#outer')!, scope: { stagger: 0.5 } },
    ])
    const v = (id: string) => at(root.querySelector(`#${id}`))
    expect([v('a'), v('x'), v('y'), v('b')]).toEqual(['0s', '0.5s', '0.55s', '1s'])
  })

  it('an inner scope that animates itself is a member of the outer one too', () => {
    const root = html(`
      <div id="outer" class="${SCOPE}">
        <div id="inner" class="${SCOPE} greese-Motion--enter">
          <p id="x" class="${ENTER}"></p>
        </div>
      </div>`)
    applyScopes([
      {
        el: root.querySelector<HTMLElement>('#outer')!,
        scope: { stagger: 0.3, delay: 1 },
      },
      { el: root.querySelector<HTMLElement>('#inner')!, scope: { stagger: 0.1 } },
    ])
    expect(at(root.querySelector('#inner'))).toBe('1s')
    expect(at(root.querySelector('#x'))).toBe('1s')
  })

  it('forgets what it set', () => {
    const root = html(
      `<div id="s" class="${SCOPE}"><p id="a" class="${ENTER}"></p></div>`
    )
    const s = root.querySelector<HTMLElement>('#s')!
    applyScopes([{ el: s, scope: { delay: 2 } }])
    expect(at(root.querySelector('#a'))).toBe('2s')
    clearScope(s)
    expect(at(root.querySelector('#a'))).toBe('')
  })
})

describe('holdUntilVisible', () => {
  it('waits for the scope to scroll into view, then lets it play', () => {
    let callback!: IntersectionObserverCallback
    const disconnect = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb
        }
        observe() {}
        disconnect = disconnect
      }
    )
    const el = document.createElement('div')
    holdUntilVisible(el, false)
    expect(el.dataset.greeseScope).toBe('pending')
    callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as never)
    expect(el.dataset.greeseScope).toBe('pending')
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as never)
    expect(el.dataset.greeseScope).toBeUndefined()
    expect(disconnect).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('does not hold a scope that is already in view', () => {
    const el = document.createElement('div')
    holdUntilVisible(el, true)
    expect(el.dataset.greeseScope).toBeUndefined()
  })
})

describe('the scope option', () => {
  it('is a class, and needs no runtime of its own', () => {
    const resolved = resolveGreese({ scope: { stagger: 0.2 } })
    expect(resolved.className).toContain('greese-Motion--scope')
    expect(resolved.runtime).toBe(false)
  })

  it('sets its members as the page renders', async () => {
    render(
      <Stack data-testid="s" greese={{ scope: { stagger: 0.2, delay: 0.1 } }}>
        <Text greese="fadeUp">one</Text>
        <div>
          <Text greese="fadeIn">two</Text>
        </div>
        <Text>no entrance</Text>
        <Text greese="fadeUp">three</Text>
      </Stack>
    )
    // The entrances wait while the start times are set, then play.
    await waitFor(() =>
      expect(['one', 'two', 'three'].map((t) => at(screen.getByText(t)))).toEqual([
        '0.1s',
        '0.3s',
        '0.5s',
      ])
    )
    expect(screen.getByTestId('s').dataset.greeseScope).toBeUndefined()
    expect(at(screen.getByText('no entrance'))).toBe('')
  })
})
