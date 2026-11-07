import { describe, expect, it } from 'vitest'
import { ROOT_GUIDE_SCOPE } from './guides.slice.ts'
import { timelineScopeReducer, timelineScopeActions } from './timelineScope.slice.ts'

const init = () => timelineScopeReducer(undefined, { type: '@@INIT' })

describe('timelineScope', () => {
  it('defaults to the root guide scope', () => {
    expect(init().activeScope).toBe(ROOT_GUIDE_SCOPE)
  })

  it('setActiveScope switches the active scope', () => {
    const state = timelineScopeReducer(
      init(),
      timelineScopeActions.setActiveScope('loop:abc')
    )
    expect(state.activeScope).toBe('loop:abc')
  })
})
