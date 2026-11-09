import { describe, expect, it } from 'vitest'
import {
  canvasToStage,
  stageToCanvas,
  panForZoomToPoint,
  clampZoom,
  MIN_ZOOM,
  MAX_ZOOM,
  wheelGesture,
} from './viewportMath.ts'

describe('viewportMath.helpers', () => {
  // ── Round-trip correctness ───────────────────────────────────────────────

  describe('canvasToStage / stageToCanvas round-trip', () => {
    const CASES = [
      { halfSize: 256, pan: 0, scale: 1, stage: 0 },
      { halfSize: 256, pan: 0, scale: 1, stage: 100 },
      { halfSize: 256, pan: 0, scale: 2, stage: 50 },
      { halfSize: 256, pan: 50, scale: 1, stage: -20 },
      { halfSize: 400, pan: -80, scale: 0.5, stage: 200 },
      { halfSize: 300, pan: 0, scale: 0.1, stage: -300 },
      { halfSize: 512, pan: 120, scale: 3.5, stage: 77 },
      { halfSize: 200, pan: -200, scale: 0.25, stage: -400 },
    ]

    for (const { halfSize, pan, scale, stage } of CASES) {
      it(`stage→canvas→stage returns ${stage} (half=${halfSize}, pan=${pan}, scale=${scale})`, () => {
        const canvas = stageToCanvas(stage, halfSize, pan, scale)
        expect(canvasToStage(canvas, halfSize, pan, scale)).toBeCloseTo(stage, 10)
      })
    }
  })

  // ── stageToCanvas at origin ──────────────────────────────────────────────

  describe('stageToCanvas', () => {
    it('stage origin maps to canvas centre when pan=0', () => {
      expect(stageToCanvas(0, 300, 0, 1)).toBe(300)
      expect(stageToCanvas(0, 300, 0, 2)).toBe(300)
    })

    it('pan shifts stage origin in canvas space', () => {
      expect(stageToCanvas(0, 300, 50, 1)).toBe(350)
      expect(stageToCanvas(0, 300, -100, 2)).toBe(200)
    })

    it('scale stretches stage coordinates', () => {
      // stage 100 at scale 2 → 200 canvas-pixels from centre → 300 + 200 = 500
      expect(stageToCanvas(100, 300, 0, 2)).toBe(500)
    })
  })

  // ── canvasToStage at canvas centre ───────────────────────────────────────

  describe('canvasToStage', () => {
    it('canvas centre maps to stage origin when pan=0', () => {
      expect(canvasToStage(300, 300, 0, 1)).toBe(0)
      expect(canvasToStage(300, 300, 0, 2)).toBe(0)
    })

    it('pan shifts which stage coord is at canvas centre', () => {
      // With pan=50, stage origin is 50px right of canvas centre.
      // At canvas centre (300): stageX = (300 - 300 - 50) / 1 = -50
      expect(canvasToStage(300, 300, 50, 1)).toBeCloseTo(-50, 10)
    })
  })

  // ── panForZoomToPoint ─────────────────────────────────────────────────────

  describe('panForZoomToPoint', () => {
    it('stage point stays at same canvas pixel after zoom-in', () => {
      const halfW = 300,
        stageX = 50,
        oldScale = 1,
        newScale = 2,
        panX = 0
      const cpxBefore = stageToCanvas(stageX, halfW, panX, oldScale)
      const { panX: newPanX } = panForZoomToPoint(stageX, 0, oldScale, newScale, panX, 0)
      expect(stageToCanvas(stageX, halfW, newPanX, newScale)).toBeCloseTo(cpxBefore, 10)
    })

    it('stage point stays at same canvas pixel after zoom-out', () => {
      const halfW = 400,
        stageX = -100,
        oldScale = 2,
        newScale = 0.5,
        panX = 80
      const cpxBefore = stageToCanvas(stageX, halfW, panX, oldScale)
      const { panX: newPanX } = panForZoomToPoint(stageX, 0, oldScale, newScale, panX, 0)
      expect(stageToCanvas(stageX, halfW, newPanX, newScale)).toBeCloseTo(cpxBefore, 10)
    })

    it('zooming at stage origin (0,0) leaves pan unchanged', () => {
      const { panX, panY } = panForZoomToPoint(0, 0, 1, 3, 0, 0)
      expect(panX).toBe(0)
      expect(panY).toBe(0)
    })

    it('works symmetrically for Y axis', () => {
      const halfH = 250,
        stageY = 75,
        oldScale = 1,
        newScale = 2,
        panY = -30
      const cpyBefore = stageToCanvas(stageY, halfH, panY, oldScale)
      const { panY: newPanY } = panForZoomToPoint(0, stageY, oldScale, newScale, 0, panY)
      expect(stageToCanvas(stageY, halfH, newPanY, newScale)).toBeCloseTo(cpyBefore, 10)
    })

    it('zooming from arbitrary pan keeps cursor fixed', () => {
      const halfW = 512,
        stageX = 200,
        oldScale = 1.5,
        newScale = 0.75,
        panX = -60
      const cpxBefore = stageToCanvas(stageX, halfW, panX, oldScale)
      const { panX: newPanX } = panForZoomToPoint(stageX, 0, oldScale, newScale, panX, 0)
      expect(stageToCanvas(stageX, halfW, newPanX, newScale)).toBeCloseTo(cpxBefore, 10)
    })
  })

  // ── clampZoom ─────────────────────────────────────────────────────────────

  describe('clampZoom', () => {
    it('clamps below MIN_ZOOM', () => {
      expect(clampZoom(0)).toBe(MIN_ZOOM)
      expect(clampZoom(-5)).toBe(MIN_ZOOM)
    })

    it('clamps above MAX_ZOOM', () => {
      expect(clampZoom(200)).toBe(MAX_ZOOM)
    })

    it('passes through values in range', () => {
      expect(clampZoom(1)).toBe(1)
      expect(clampZoom(0.5)).toBe(0.5)
      expect(clampZoom(2.5)).toBe(2.5)
    })
  })
})

describe('wheelGesture', () => {
  it('zooms one step at a plain wheel, in when it rolls away', () => {
    expect(wheelGesture({ deltaX: 0, deltaY: -3, shiftKey: false })).toEqual({
      kind: 'zoom',
      factor: 1.1,
    })
    expect(wheelGesture({ deltaX: 0, deltaY: 40, shiftKey: false })).toEqual({
      kind: 'zoom',
      factor: 1 / 1.1,
    })
  })

  it('pans for a sideways swipe or Shift, and does nothing for no travel', () => {
    expect(wheelGesture({ deltaX: 5, deltaY: 0, shiftKey: false })).toEqual({
      kind: 'pan',
      x: 5,
      y: 0,
    })
    expect(wheelGesture({ deltaX: 0, deltaY: 7, shiftKey: true })).toEqual({
      kind: 'pan',
      x: 0,
      y: 7,
    })
    expect(wheelGesture({ deltaX: 0, deltaY: 0, shiftKey: false })).toBeNull()
  })
})
