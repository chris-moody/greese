import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  AuthoringView,
  createAuthoringEnvironment,
  layersActions,
  makeFolder,
  makeLayer,
  MarkerPanel,
  PanelArea,
  playbackActions,
  Timeline,
  TimelineHeader,
  timelineActions,
  TweenPanel,
  usePlaybackClock,
} from '../index.ts'
import { expectNoAxeViolations } from '../test/axe.ts'

/** An editor with one layer keyed at frames 0 and 10, tweened between. */
const animated = (frames = 24) => {
  const env = createAuthoringEnvironment({
    config: { timing: { mode: 'fps', frameRate: 24, frameCount: frames } as never },
  })
  env.store.dispatch(playbackActions.setFrameCount(frames))
  const layer = makeLayer({ name: 'Ball' })
  env.store.dispatch(layersActions.addLayer({ layer }))
  env.store.dispatch(layersActions.addKeyframe({ layerId: layer.id, frame: 0, value: 0 }))
  env.store.dispatch(
    layersActions.addKeyframe({ layerId: layer.id, frame: 10, value: 100 })
  )
  const keys = env.store.getState().layers.layers.get(layer.id)!.timeline.frames
  env.store.dispatch(
    layersActions.createTween({
      layerId: layer.id,
      startKeyframeId: keys[0]!.id,
      endKeyframeId: keys[1]!.id,
    })
  )
  return { env, layer }
}

// jsdom has no layout observers; the timeline sizes itself with one.
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Timeline', () => {
  it('lays out the header, the layers and their frames', async () => {
    const { env } = animated()
    const { container } = render(
      <env.Provider>
        <div style={{ height: 300 }}>
          <Timeline />
        </div>
      </env.Provider>
    )
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByRole('tree', { name: 'Layers' })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /Ball/ })).toBeInTheDocument()
    expect(container.querySelector('.greese-TimelineRuler-ruler')).toBeInTheDocument()
    expect(
      container.querySelectorAll(
        '.greese-TimelineFrames-row, [class*="greese-TimelineFrames"]'
      ).length
    ).toBeGreaterThan(0)
    await expectNoAxeViolations(container)
    // axe over the whole timeline is slow in jsdom.
  }, 20_000)

  it('leaves Escape to the page with nothing selected, and keys a dialog owns alone', () => {
    const { env } = animated()
    render(
      <env.Provider>
        <Timeline />
        <div role="dialog" aria-label="Elsewhere">
          <button type="button">Inside</button>
        </div>
      </env.Provider>
    )
    const escape = () => fireEvent.keyDown(window, { key: 'Escape' })
    expect(escape()).toBe(true)
    const frames = env.store.getState().layers.layers.values().next().value!.timeline
      .frames
    act(() => {
      env.store.dispatch(timelineActions.setTimelineSelection([frames[0]!.id]))
    })
    expect(escape()).toBe(false)
    expect(env.store.getState().timeline.selection.size).toBe(0)
    // An arrow inside a dialog is the dialog's: the playhead stays.
    act(() => {
      env.store.dispatch(playbackActions.setCurrentFrame(5))
    })
    fireEvent.keyDown(screen.getByRole('button', { name: 'Inside' }), {
      key: 'ArrowRight',
    })
    expect(env.store.getState().playback.currentFrame).toBe(5)
    // One something else handled is left alone too.
    const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    handled.preventDefault()
    act(() => {
      window.dispatchEvent(handled)
    })
    expect(env.store.getState().playback.currentFrame).toBe(5)
  })
})

describe('usePlaybackClock', () => {
  const Clock = () => {
    usePlaybackClock()
    return null
  }

  // A clock left looping would hold greese.js's shared ticker into the next
  // test: unmount, then let a frame pass so it stops.
  afterEach(() => {
    cleanup()
    vi.advanceTimersByTime(50)
  })

  it('advances the playhead on greese.js, and stops at the end', async () => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
    const { env } = animated(24)
    render(
      <env.Provider>
        <Clock />
      </env.Provider>
    )
    act(() => {
      env.store.dispatch(playbackActions.setLoop(false))
      env.store.dispatch(playbackActions.play())
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    const frame = env.store.getState().playback.currentFrame
    expect(frame).toBeGreaterThanOrEqual(10)
    expect(frame).toBeLessThanOrEqual(13)
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    // Not looping: it stopped on the last frame.
    expect(env.store.getState().playback.playing).toBe(false)
    expect(env.store.getState().playback.currentFrame).toBe(23)
  })

  it('loops when asked', async () => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
    const { env } = animated(12)
    render(
      <env.Provider>
        <Clock />
      </env.Provider>
    )
    act(() => {
      env.store.dispatch(playbackActions.setLoop(true))
      env.store.dispatch(playbackActions.play())
    })
    await act(async () => {
      vi.advanceTimersByTime(700)
    })
    expect(env.store.getState().playback.playing).toBe(true)
    // 0.7 s at 24 fps is frame 16: a lap of 12 frames on, frame 4.
    expect(env.store.getState().playback.currentFrame).toBeLessThan(8)
  })

  it('plays on from a frame set elsewhere while playing', async () => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
    const { env } = animated(48)
    render(
      <env.Provider>
        <Clock />
      </env.Provider>
    )
    act(() => {
      env.store.dispatch(playbackActions.setLoop(false))
      env.store.dispatch(playbackActions.play())
    })
    await act(async () => {
      vi.advanceTimersByTime(100)
    })
    act(() => {
      env.store.dispatch(playbackActions.setCurrentFrame(30))
    })
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    // A quarter second on from 30, at 24 fps: about 36, not about 8.
    const frame = env.store.getState().playback.currentFrame
    expect(frame).toBeGreaterThanOrEqual(34)
    expect(frame).toBeLessThanOrEqual(38)
  })
})

describe('TimelineHeader', () => {
  it('plays and pauses, and adds frames by keyboard or held', async () => {
    const { env } = animated()
    const onAddFrame = vi.fn()
    const { container } = render(
      <env.Provider>
        <TimelineHeader
          onAddFrame={onAddFrame}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
        />
      </env.Provider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(env.store.getState().playback.playing).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(env.store.getState().playback.playing).toBe(false)

    const add = screen.getByRole('button', { name: /Add frame/i })
    // A keyboard press is a click with no pointer.
    fireEvent.click(add, { detail: 0 })
    expect(onAddFrame).toHaveBeenCalledTimes(1)
    vi.useFakeTimers()
    fireEvent.pointerDown(add)
    vi.advanceTimersByTime(400 + 90 * 2)
    fireEvent.pointerUp(add)
    vi.advanceTimersByTime(500)
    expect(onAddFrame).toHaveBeenCalledTimes(4)
    vi.useRealTimers()
    await expectNoAxeViolations(container)
  })
})

describe('TweenPanel and MarkerPanel', () => {
  it('edits the selected tween', async () => {
    const { env, layer } = animated()
    const tween = env.store.getState().layers.layers.get(layer.id)!.timeline.tweens[0]!
    const { container } = render(
      <env.Provider>
        <TweenPanel />
      </env.Provider>
    )
    expect(container.textContent).toMatch(/tween/i)
    act(() => {
      env.store.dispatch(
        timelineActions.selectTween({ layerId: layer.id, tweenId: tween.id })
      )
    })
    expect(
      screen.getAllByRole('combobox').length + screen.getAllByRole('switch').length
    ).toBeGreaterThan(0)
    await expectNoAxeViolations(container)
  })

  it('names and moves the selected marker', async () => {
    const { env } = animated()
    act(() => {
      env.store.dispatch(
        timelineActions.addMarker({
          scope: env.store.getState().timelineScope?.activeScope ?? 'root',
          frame: 4,
          label: 'Hit',
        })
      )
    })
    const marker = env.store.getState().timeline.markers[0]!
    const { container } = render(
      <env.Provider>
        <MarkerPanel />
      </env.Provider>
    )
    act(() => {
      env.store.dispatch(timelineActions.setMarkerSelection([marker.id]))
    })
    const name = screen.getByRole('textbox')
    expect(name).toHaveValue('Hit')
    fireEvent.change(name, { target: { value: 'Impact' } })
    fireEvent.blur(name)
    expect(env.store.getState().timeline.markers[0]!.label).toBe('Impact')
    await expectNoAxeViolations(container)
  })
})

describe('AuthoringView', () => {
  it('docks the panels around the stage and the timeline', () => {
    const { env } = animated()
    render(
      <env.Provider>
        <div style={{ height: 600 }}>
          <AuthoringView
            panels={[
              {
                id: 'tween',
                title: 'Tween',
                area: PanelArea.RIGHT,
                component: TweenPanel,
              },
            ]}
          />
        </div>
      </env.Provider>
    )
    expect(screen.getByRole('tab', { name: 'Tween' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rulers' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('leaves the timeline out when told', () => {
    const { env } = animated()
    render(
      <env.Provider>
        <AuthoringView panels={[]} timeline={false} />
      </env.Provider>
    )
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument()
  })
})

describe('the layer menu', () => {
  it('opens on a row’s right-click and duplicates the layer', () => {
    const { env } = animated()
    render(
      <env.Provider>
        <Timeline />
      </env.Provider>
    )
    fireEvent.contextMenu(screen.getByRole('treeitem', { name: /Ball/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Duplicate/, hidden: true }))
    expect(env.store.getState().layers.layers.size).toBe(2)
  })

  it('offers paste only with something copied, and says what Hide will do now', () => {
    const { env, layer } = animated()
    render(
      <env.Provider>
        <Timeline />
      </env.Provider>
    )
    fireEvent.contextMenu(screen.getByRole('treeitem', { name: /Ball/ }))
    const paste = screen.getByRole('menuitem', { name: 'Paste Into Layer', hidden: true })
    expect(paste).toHaveAttribute('aria-disabled', 'true')
    // The menu follows the layer while open.
    act(() => {
      env.store.dispatch(
        layersActions.updateLayer({ id: layer.id, updates: { hidden: true } })
      )
    })
    expect(
      screen.getByRole('menuitem', { name: 'Show', hidden: true })
    ).toBeInTheDocument()
  })

  it('has no Duplicate or Paste for a folder', () => {
    const { env } = animated()
    env.store.dispatch(layersActions.addLayer({ layer: makeFolder('Group') }))
    render(
      <env.Provider>
        <Timeline />
      </env.Provider>
    )
    fireEvent.contextMenu(screen.getByRole('treeitem', { name: /Group/ }))
    expect(
      screen.getByRole('menuitem', { name: 'New Layer', hidden: true })
    ).toBeInTheDocument()
    for (const name of ['Duplicate', 'Paste Into Layer'])
      expect(
        screen.queryByRole('menuitem', { name, hidden: true })
      ).not.toBeInTheDocument()
  })
})
