import { describe, expect, it } from 'vitest'
import { stableTopFrame } from './navigation.helpers.ts'
import { NavMode, type NavFrame } from './navigation.slice.ts'
import { emptyLayerState } from '../core/layers/layers.ts'

const frame = (assetId: string, mode: NavMode): NavFrame => ({
  assetId,
  name: assetId,
  mode,
  parentLayers: emptyLayerState(),
  stageTransform: null,
})

describe('stableTopFrame', () => {
  it('returns null for an empty stack', () => {
    expect(stableTopFrame([])).toBeNull()
  })

  it('returns the top frame when it is ISOLATED', () => {
    const stack = [frame('a', NavMode.ISOLATED)]
    expect(stableTopFrame(stack)).toBe(stack[0])
  })

  it('skips trailing EDIT_IN_PLACE frames to find the nearest ISOLATED ancestor', () => {
    const isolated = frame('a', NavMode.ISOLATED)
    const stack = [
      isolated,
      frame('b', NavMode.EDIT_IN_PLACE),
      frame('c', NavMode.EDIT_IN_PLACE),
    ]
    expect(stableTopFrame(stack)).toBe(isolated)
  })

  it('returns null when every frame on the stack is EDIT_IN_PLACE', () => {
    const stack = [frame('a', NavMode.EDIT_IN_PLACE)]
    expect(stableTopFrame(stack)).toBeNull()
  })
})
