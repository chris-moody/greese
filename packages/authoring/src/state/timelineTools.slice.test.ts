import { describe, expect, it } from 'vitest'
import {
  timelineToolsReducer,
  timelineToolsActions,
  TimelineToolId,
} from './timelineTools.slice.ts'

const init = () => timelineToolsReducer(undefined, { type: '@@INIT' })

describe('timelineTools', () => {
  it('starts with no scope overrides', () => {
    expect(init().toolByScope).toEqual({})
  })

  it('setTool records the active tool per scope', () => {
    let state = timelineToolsReducer(
      init(),
      timelineToolsActions.setTool({ scope: 'root', tool: TimelineToolId.marker })
    )
    state = timelineToolsReducer(
      state,
      timelineToolsActions.setTool({ scope: 'loop:a', tool: TimelineToolId.rate })
    )
    expect(state.toolByScope).toEqual({
      root: TimelineToolId.marker,
      'loop:a': TimelineToolId.rate,
    })
  })

  it('hydrate replaces the whole map (e.g. loading a persisted document)', () => {
    let state = timelineToolsReducer(
      init(),
      timelineToolsActions.setTool({ scope: 'root', tool: TimelineToolId.marker })
    )
    state = timelineToolsReducer(
      state,
      timelineToolsActions.hydrate({ 'loop:b': TimelineToolId.timeSignature })
    )
    expect(state.toolByScope).toEqual({ 'loop:b': TimelineToolId.timeSignature })
  })
})
