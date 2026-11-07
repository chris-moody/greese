import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import {
  AuthoringBreadcrumbs,
  createAuthoringEnvironment,
  layersActions,
  makeLayer,
  NavMode,
  navigationActions,
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
