import { describe, expect, it } from 'vitest'
import {
  ROOT_GUIDE_SCOPE,
  guidesActions,
  guidesReducer,
  type AuthoringGuide,
} from './guides.slice.ts'

const init = () => guidesReducer(undefined, { type: '@@INIT' })

describe('guides', () => {
  it('defaults to the root guide scope with no guides', () => {
    const state = init()
    expect(state.activeScope).toBe(ROOT_GUIDE_SCOPE)
    expect(state.guides).toEqual([])
  })

  describe('addGuide auto-naming', () => {
    it('names the first guide "Guide 0"', () => {
      const state = guidesReducer(init(), guidesActions.addGuide({ axis: 'h', pos: 10 }))
      expect(state.guides).toHaveLength(1)
      expect(state.guides[0]!.name).toBe('Guide 0')
    })

    it('numbers subsequent guides one past the highest existing index', () => {
      let state = init()
      state = guidesReducer(state, guidesActions.addGuide({ axis: 'h', pos: 10 }))
      state = guidesReducer(state, guidesActions.addGuide({ axis: 'v', pos: 20 }))
      expect(state.guides.map((g) => g.name)).toEqual(['Guide 0', 'Guide 1'])
    })

    it('numbers globally across scopes, not per-scope', () => {
      let state = init()
      state = guidesReducer(state, guidesActions.addGuide({ axis: 'h', pos: 10 }))
      state = guidesReducer(state, guidesActions.setActiveScope('symbol-a'))
      state = guidesReducer(state, guidesActions.addGuide({ axis: 'v', pos: 20 }))
      expect(state.guides.map((g) => g.name)).toEqual(['Guide 0', 'Guide 1'])
    })

    it('tags a new guide with the currently active scope', () => {
      let state = init()
      state = guidesReducer(state, guidesActions.setActiveScope('symbol-a'))
      state = guidesReducer(state, guidesActions.addGuide({ axis: 'h', pos: 10 }))
      expect(state.guides[0]!.scope).toBe('symbol-a')
    })
  })

  describe('renameGuide', () => {
    it('renames the matching guide only', () => {
      let state = init()
      state = guidesReducer(state, guidesActions.addGuide({ axis: 'h', pos: 10 }))
      state = guidesReducer(state, guidesActions.addGuide({ axis: 'v', pos: 20 }))
      const [first, second] = state.guides as [AuthoringGuide, AuthoringGuide]
      state = guidesReducer(
        state,
        guidesActions.renameGuide({ id: first.id, name: 'Ground' })
      )
      expect(state.guides.find((g) => g.id === first.id)!.name).toBe('Ground')
      expect(state.guides.find((g) => g.id === second.id)!.name).toBe('Guide 1')
    })

    it('is a no-op for an unknown id', () => {
      const state = guidesReducer(
        init(),
        guidesActions.renameGuide({ id: 'missing', name: 'Ground' })
      )
      expect(state.guides).toEqual([])
    })
  })

  describe('setGuideGlobal', () => {
    it('marks the matching guide global', () => {
      let state = init()
      state = guidesReducer(state, guidesActions.addGuide({ axis: 'h', pos: 10 }))
      const id = state.guides[0]!.id
      state = guidesReducer(state, guidesActions.setGuideGlobal({ id, isGlobal: true }))
      expect(state.guides[0]!.isGlobal).toBe(true)
    })

    it('can toggle a guide back off global', () => {
      let state = init()
      state = guidesReducer(state, guidesActions.addGuide({ axis: 'h', pos: 10 }))
      const id = state.guides[0]!.id
      state = guidesReducer(state, guidesActions.setGuideGlobal({ id, isGlobal: true }))
      state = guidesReducer(state, guidesActions.setGuideGlobal({ id, isGlobal: false }))
      expect(state.guides[0]!.isGlobal).toBe(false)
    })
  })
})
