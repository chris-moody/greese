import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import {
  AuthoringBreadcrumbs,
  createAuthoringEnvironment,
  guidesActions,
  layersActions,
  makeLayer,
  NavMode,
  navigationActions,
  rulerTicks,
  StageContext,
  StageHost,
  type RenderObject,
  type StageBackend,
} from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

/** A backend whose one object covers the stage's left half. */
const fakeBackend = (id: string): StageBackend => {
  const object: RenderObject = {
    id,
    visible: true,
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    update: vi.fn(),
    setSelected: vi.fn(),
    bounds: () => ({ x: 0, y: 0, width: 50, height: 100 }),
    hitTest: ({ x }) => x < 50,
    destroy: vi.fn(),
  }
  return {
    objects: new Map([[id, object]]),
    getObjectAt: ({ x }) => (x < 50 ? object : null),
    destroy: vi.fn(),
  }
}

describe('StageHost', () => {
  it('says there is no backend when the media has none', async () => {
    const env = createAuthoringEnvironment({ config: { mediaType: 'svg' } })
    const { container } = render(
      <env.Provider>
        <StageHost />
      </env.Provider>
    )
    expect(screen.getByRole('region', { name: 'Stage' })).toHaveTextContent(
      'Stage · svg (no backend)'
    )
    await expectNoAxeViolations(container)
  })

  it('mounts the backend, reports it, and selects what a click hits', () => {
    const layer = makeLayer({ name: 'Star', layerType: 'layer' })
    const backend = fakeBackend(layer.id)
    const env = createAuthoringEnvironment({ config: { createStage: () => backend } })
    act(() => env.store.dispatch(layersActions.addLayer({ layer })))
    const onBackendChange = vi.fn()
    const { unmount } = render(
      <env.Provider>
        <StageHost onBackendChange={onBackendChange} />
      </env.Provider>
    )
    expect(onBackendChange).toHaveBeenCalledWith(backend)
    const stage = screen.getByRole('region', { name: 'Stage' })
    fireEvent.pointerDown(stage, { clientX: 10, clientY: 10 })
    expect([...env.store.getState().layers.selection]).toEqual([layer.id])
    fireEvent.pointerDown(stage, { clientX: 90, clientY: 10 })
    expect(env.store.getState().layers.selection.size).toBe(0)
    unmount()
    expect(onBackendChange).toHaveBeenLastCalledWith(null)
    expect(backend.destroy).toHaveBeenCalled()
  })
})

describe('StageHost wheel', () => {
  const mount = (wheelZoom?: boolean) => {
    const backend = { ...fakeBackend('a'), zoomBy: vi.fn(), panBy: vi.fn() }
    const env = createAuthoringEnvironment({ config: { createStage: () => backend } })
    render(
      <env.Provider>
        <StageHost wheelZoom={wheelZoom} />
      </env.Provider>
    )
    return { backend, stage: screen.getByRole('region', { name: 'Stage' }) }
  }

  it('zooms at the pointer and pans sideways or with Shift, as in Pixels', () => {
    const { backend, stage } = mount()
    const zoomIn = new WheelEvent('wheel', {
      deltaY: -100,
      clientX: 30,
      clientY: 40,
      cancelable: true,
    })
    stage.dispatchEvent(zoomIn)
    expect(zoomIn.defaultPrevented).toBe(true)
    expect(backend.zoomBy).toHaveBeenCalledWith(1.1, { x: 30, y: 40 })
    fireEvent.wheel(stage, { deltaY: 100 })
    expect(backend.zoomBy).toHaveBeenLastCalledWith(1 / 1.1, { x: 0, y: 0 })
    fireEvent.wheel(stage, { deltaX: 12 })
    expect(backend.panBy).toHaveBeenCalledWith(12, 0)
    fireEvent.wheel(stage, { deltaY: 20, shiftKey: true })
    expect(backend.panBy).toHaveBeenLastCalledWith(0, 20)
  })

  it('leaves the wheel to the browser when turned off', () => {
    const { backend, stage } = mount(false)
    const event = new WheelEvent('wheel', { deltaY: -100, cancelable: true })
    stage.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(backend.zoomBy).not.toHaveBeenCalled()
  })
})

describe('StageContext and AuthoringBreadcrumbs', () => {
  it('toggles the rulers, pressed while they show', () => {
    const env = createAuthoringEnvironment()
    render(
      <env.Provider>
        <StageContext />
      </env.Provider>
    )
    const rulers = screen.getByRole('button', { name: 'Rulers' })
    expect(rulers).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(rulers)
    expect(env.store.getState().panels.showRulers).toBe(true)
    expect(screen.getByRole('button', { name: 'Rulers' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('hides and shows the guides, keeping them, and a new guide shows them again', () => {
    const env = createAuthoringEnvironment()
    env.store.dispatch(guidesActions.addGuide({ axis: 'h', pos: 10 }))
    render(
      <env.Provider>
        <StageContext />
      </env.Provider>
    )
    const toggle = screen.getByRole('button', { name: 'Guides' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(toggle)
    expect(env.store.getState().guides.hidden).toBe(true)
    expect(env.store.getState().guides.guides).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Guides' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    act(() => {
      env.store.dispatch(guidesActions.addGuide({ axis: 'v', pos: 4 }))
    })
    expect(env.store.getState().guides.hidden).toBe(false)
  })

  it('shows the subview trail, and steps back up it', () => {
    const env = createAuthoringEnvironment()
    render(
      <env.Provider>
        <StageContext breadcrumbs={<AuthoringBreadcrumbs />} />
      </env.Provider>
    )
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    act(() => {
      env.store.dispatch(
        navigationActions.pushFrame({
          assetId: 'a',
          name: 'Button',
          mode: NavMode.ISOLATED,
          parentLayers: env.store.getState().layers,
          stageTransform: null,
        })
      )
    })
    expect(screen.getByRole('navigation', { name: 'Subview trail' })).toHaveTextContent(
      'Button'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Root' }))
    expect(env.store.getState().navigation.stack).toEqual([])
  })
})

describe('rulerTicks', () => {
  it('labels on a 1, 2, 5 step at least 40px apart, with ticks between', () => {
    // An icon at 1600%: a label every 5 units, a tick per unit.
    expect(rulerTicks(16)).toEqual({ minor: 1, major: 5 })
    // A scene at 100% and at 50%.
    expect(rulerTicks(1)).toEqual({ minor: 10, major: 50 })
    expect(rulerTicks(0.5)).toEqual({ minor: 20, major: 100 })
  })
})
