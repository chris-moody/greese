import { describe, expect, it } from 'vitest'
import {
  beginBoxDrag,
  boundsOfBoxes,
  boxFromCorners,
  boxPressAt,
  dragBox,
  fitBoxTo,
  resizeBox,
} from './boxEdit.ts'

const box = { x: 10, y: 20, width: 100, height: 50 }

describe('boxFromCorners', () => {
  it('spans the drag, whichever way it went', () => {
    expect(boxFromCorners({ x: 50, y: 60 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 40,
      height: 40,
    })
  })

  it('grows to the minimum on the side the drag went', () => {
    expect(boxFromCorners({ x: 50, y: 50 }, { x: 48, y: 52 }, 10)).toEqual({
      x: 40,
      y: 50,
      width: 10,
      height: 10,
    })
  })
})

describe('boxPressAt', () => {
  it('finds a handle, then the outline, then the inside', () => {
    expect(boxPressAt(box, { x: 111, y: 71 }, 4)).toEqual({
      kind: 'handle',
      handle: 'se',
    })
    expect(boxPressAt(box, { x: 60, y: 19 }, 4)).toEqual({ kind: 'handle', handle: 'n' })
    expect(boxPressAt(box, { x: 30, y: 22 }, 4)).toEqual({ kind: 'edge' })
    expect(boxPressAt(box, { x: 107, y: 40 }, 4)).toEqual({ kind: 'edge' })
    expect(boxPressAt(box, { x: 40, y: 40 }, 4)).toEqual({ kind: 'inside' })
    expect(boxPressAt(box, { x: 200, y: 40 }, 4)).toEqual({ kind: 'outside' })
  })
})

describe('resizeBox', () => {
  it('keeps the opposite edges where they were', () => {
    // The left edge out by 10: the right edge stays at 110.
    expect(resizeBox(box, 'w', { x: -10, y: 5 })).toEqual({
      x: 0,
      y: 20,
      width: 110,
      height: 50,
    })
    // The top left in: the bottom right stays at (110, 70).
    expect(resizeBox(box, 'nw', { x: 20, y: 10 })).toEqual({
      x: 30,
      y: 30,
      width: 80,
      height: 40,
    })
    expect(resizeBox(box, 'se', { x: 5, y: -5 })).toEqual({
      x: 10,
      y: 20,
      width: 105,
      height: 45,
    })
  })

  it('stops an edge at the minimum, not past the opposite one', () => {
    expect(resizeBox(box, 'w', { x: 500, y: 0 }, { min: 10 })).toEqual({
      x: 100,
      y: 20,
      width: 10,
      height: 50,
    })
  })

  it('keeps the proportions from a corner, and resizes about the centre', () => {
    expect(resizeBox(box, 'se', { x: 100, y: 0 }, { keepAspect: true })).toEqual({
      x: 10,
      y: 20,
      width: 200,
      height: 100,
    })
    expect(resizeBox(box, 'e', { x: 10, y: 0 }, { fromCenter: true })).toEqual({
      x: 0,
      y: 20,
      width: 120,
      height: 50,
    })
  })
})

describe('fitBoxTo', () => {
  it('keeps a box in its place in the group', () => {
    const from = { x: 0, y: 0, width: 100, height: 100 }
    const to = { x: 50, y: 0, width: 50, height: 100 }
    expect(fitBoxTo({ x: 50, y: 10, width: 50, height: 20 }, from, to)).toEqual({
      x: 75,
      y: 10,
      width: 25,
      height: 20,
    })
  })

  it('bounds a group', () => {
    expect(boundsOfBoxes([box, { x: 0, y: 0, width: 5, height: 5 }])).toEqual({
      x: 0,
      y: 0,
      width: 110,
      height: 70,
    })
    expect(boundsOfBoxes([])).toBeNull()
  })
})

describe('beginBoxDrag and dragBox', () => {
  it('draws a new box outside, and none without a box', () => {
    const drag = beginBoxDrag(box, { x: 200, y: 200 }, 4)!
    expect(drag.kind).toBe('create')
    expect(dragBox(drag, { x: 220, y: 230 })).toEqual({
      x: 200,
      y: 200,
      width: 20,
      height: 30,
    })
    expect(beginBoxDrag(null, { x: 40, y: 40 }, 4)?.kind).toBe('create')
  })

  it('moves from the outline, resizes from a handle, and edits inside', () => {
    const move = beginBoxDrag(box, { x: 30, y: 20 }, 4)!
    expect(dragBox(move, { x: 35, y: 30 })).toEqual({
      x: 15,
      y: 30,
      width: 100,
      height: 50,
    })
    const resize = beginBoxDrag(box, { x: 10, y: 45 }, 4)!
    expect(resize).toMatchObject({ kind: 'resize', handle: 'w' })
    expect(dragBox(resize, { x: 0, y: 45 })).toEqual({
      x: 0,
      y: 20,
      width: 110,
      height: 50,
    })
    expect(beginBoxDrag(box, { x: 40, y: 40 }, 4)).toBeNull()
  })
})
