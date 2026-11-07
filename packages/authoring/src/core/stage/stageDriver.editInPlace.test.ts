import { describe, expect, it } from 'vitest'
import { NavMode, type NavFrame } from '../../state/navigation.slice.ts'
import { resolveEditInPlaceTransition } from './stageDriver.ts'

const editInPlaceFrame = (assetId: string): NavFrame => ({
  assetId,
  name: assetId,
  mode: NavMode.EDIT_IN_PLACE,
  parentLayers: {
    layers: new Map(),
    rootOrder: [],
    selection: new Set(),
    collapsed: new Set(),
  },
  stageTransform: null,
})

const isolatedFrame = (assetId: string): NavFrame => ({
  assetId,
  name: assetId,
  mode: NavMode.ISOLATED,
  parentLayers: {
    layers: new Map(),
    rootOrder: [],
    selection: new Set(),
    collapsed: new Set(),
  },
  stageTransform: null,
})

describe('resolveEditInPlaceTransition', () => {
  it('a fresh drill-in (stack grew onto an EDIT_IN_PLACE frame) composes and skips the destroy pass', () => {
    const result = resolveEditInPlaceTransition(editInPlaceFrame('level1'), 1, 0, true)
    expect(result).toEqual({
      landsOnEditInPlace: true,
      skipDestroy: true,
      shouldReset: false,
    })
  })

  it('a second-level drill-in (stack grew again onto another EDIT_IN_PLACE frame) also skips the destroy pass', () => {
    const result = resolveEditInPlaceTransition(editInPlaceFrame('level2'), 2, 1, true)
    expect(result).toEqual({
      landsOnEditInPlace: true,
      skipDestroy: true,
      shouldReset: false,
    })
  })

  it('stepping back one level to a still-EDIT_IN_PLACE frame composes but does NOT skip the destroy pass', () => {
    // This is the case the framework used to get wrong: it read a shrinking
    // stack as "not an entry" unconditionally and called resetEditInPlace
    // instead, corrupting the shallower level's parenting/ghost state and
    // leaving the deeper level's own objects stranded as duplicate ghosts.
    const result = resolveEditInPlaceTransition(editInPlaceFrame('level1'), 1, 2, true)
    expect(result).toEqual({
      landsOnEditInPlace: true,
      skipDestroy: false,
      shouldReset: false,
    })
  })

  it('jumping several levels back at once to a still-EDIT_IN_PLACE frame also composes without skipping destroy', () => {
    const result = resolveEditInPlaceTransition(editInPlaceFrame('level1'), 1, 4, true)
    expect(result).toEqual({
      landsOnEditInPlace: true,
      skipDestroy: false,
      shouldReset: false,
    })
  })

  it('holding at the same stack length but landing on a different EDIT_IN_PLACE frame composes without skipping destroy', () => {
    const result = resolveEditInPlaceTransition(editInPlaceFrame('sibling'), 2, 2, true)
    expect(result).toEqual({
      landsOnEditInPlace: true,
      skipDestroy: false,
      shouldReset: false,
    })
  })

  it('landing on an ISOLATED frame is a genuine exit regardless of growth/shrink', () => {
    expect(resolveEditInPlaceTransition(isolatedFrame('other'), 1, 0, true)).toEqual({
      landsOnEditInPlace: false,
      skipDestroy: false,
      shouldReset: true,
    })
    expect(resolveEditInPlaceTransition(isolatedFrame('other'), 0, 2, true)).toEqual({
      landsOnEditInPlace: false,
      skipDestroy: false,
      shouldReset: true,
    })
  })

  it('landing at the root (null top frame) is a genuine exit', () => {
    const result = resolveEditInPlaceTransition(null, 0, 2, true)
    expect(result).toEqual({
      landsOnEditInPlace: false,
      skipDestroy: false,
      shouldReset: true,
    })
  })

  it('a backend without composeEditInPlace support never lands on edit-in-place, even growing onto one', () => {
    const result = resolveEditInPlaceTransition(editInPlaceFrame('level1'), 1, 0, false)
    expect(result).toEqual({
      landsOnEditInPlace: false,
      skipDestroy: false,
      shouldReset: true,
    })
  })
})
