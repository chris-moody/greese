import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { createAuthoringEnvironment, GuidesOverlay, guidesActions } from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

// jsdom has no layout: give the stage a size, and an observer that does nothing.
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 400,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 300,
  })
  globalThis.ResizeObserver ??= class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver
})
// The overrides are own properties; deleting them brings back Element's.
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth')
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight')
})

const setup = () => {
  const env = createAuthoringEnvironment()
  const { container } = render(
    <env.Provider>
      <div>
        <GuidesOverlay offsetX={0} offsetY={0} scale={1} />
      </div>
    </env.Provider>
  )
  act(() => env.store.dispatch(guidesActions.addGuide({ axis: 'h', pos: 20 })))
  const guide = () => env.store.getState().guides.guides[0]!
  return { env, container, guide }
}

describe('GuidesOverlay', () => {
  it('draws each guide as a named slider at its position, and passes axe', async () => {
    const { container } = setup()
    const slider = screen.getByRole('slider', { name: /horizontal/ })
    expect(slider).toHaveAttribute('aria-valuenow', '20')
    expect(slider).toHaveAttribute('aria-orientation', 'vertical')
    // At the stage's center plus its position: 300 / 2 + 20.
    expect(slider).toHaveAttribute('y1', '170')
    await expectNoAxeViolations(container)
  })

  it('moves a guide with the arrow keys along its axis, ten at a time with Shift', () => {
    const { guide } = setup()
    const slider = screen.getByRole('slider')
    fireEvent.keyDown(slider, { key: 'ArrowDown' })
    expect(guide().pos).toBe(21)
    fireEvent.keyDown(slider, { key: 'ArrowUp', shiftKey: true })
    expect(guide().pos).toBe(11)
    // Not the other axis.
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(guide().pos).toBe(11)
  })

  it('opens its properties with Enter, and saves them', () => {
    const { guide } = setup()
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'Enter' })
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Baseline' },
    })
    fireEvent.click(screen.getByRole('switch', { name: 'Global guide' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(guide()).toMatchObject({ name: 'Baseline', isGlobal: true, pos: 20 })
  })

  it('removes a guide with Delete', () => {
    const { env } = setup()
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'Delete' })
    expect(env.store.getState().guides.guides).toEqual([])
  })
})
