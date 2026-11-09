/**
 * Editing a scene in place: the transform that places a drilled-into scene
 * (a symbol, a skin slot) within the root stage, and points taken into and
 * out of it. The camera stays the root's; the scene being edited is drawn
 * through its frame's `stageTransform`, and a pointer's point is taken back
 * into the scene's own units through the inverse, so tools work there as
 * they do at the root. Lifted from Pixels' backend (`toEditSceneLocal`,
 * `fromEditSceneLocal`) and Rigatron's `composeStageTransform`, so every
 * editor that edits in place (Shaper's definitions too) shares one copy.
 * Pure, and renderer-free: `Matrix2D` is the a/b/c/d/tx/ty convention Pixi's
 * `Matrix`, SVG's `matrix()` and DOMMatrix share.
 */
import type { Matrix2D } from './renderObject.types.ts'

/** A point, as `toEditSceneLocal` and `fromEditSceneLocal` take and give it. */
export interface StagePoint {
  x: number
  y: number
}

/**
 * `local` (where an instance places its scene, within the scene it sits in)
 * then `effective` (what already places that scene in the root: the current
 * edit-in-place frame's `stageTransform`, or `null` at the root, which is
 * identity). Local first, as Pixels' `openInstanceInPlace` appends it.
 */
export const composeStageTransform = (
  local: Matrix2D,
  effective: Matrix2D | null
): Matrix2D => {
  if (!effective) return local
  return {
    a: effective.a * local.a + effective.c * local.b,
    b: effective.b * local.a + effective.d * local.b,
    c: effective.a * local.c + effective.c * local.d,
    d: effective.b * local.c + effective.d * local.d,
    tx: effective.a * local.tx + effective.c * local.ty + effective.tx,
    ty: effective.b * local.tx + effective.d * local.ty + effective.ty,
  }
}

/** The inverse transform, or `null` for one that flattens the scene (a zero scale). */
export const invertStageTransform = (m: Matrix2D): Matrix2D | null => {
  const det = m.a * m.d - m.b * m.c
  if (!det) return null
  return {
    a: m.d / det,
    b: -m.b / det,
    c: -m.c / det,
    d: m.a / det,
    tx: (m.c * m.ty - m.d * m.tx) / det,
    ty: (m.b * m.tx - m.a * m.ty) / det,
  }
}

/**
 * A point in the root stage's units, taken into the scene being edited in
 * place: where a tool working in that scene's units draws. Unchanged with no
 * frame (`null`), or one that can't be inverted.
 */
export const toEditSceneLocal = (
  transform: Matrix2D | null,
  point: StagePoint
): StagePoint => {
  const inverse = transform && invertStageTransform(transform)
  return inverse ? fromEditSceneLocal(inverse, point) : point
}

/** The inverse of `toEditSceneLocal`: a point in the scene's units, out to the root stage's. */
export const fromEditSceneLocal = (
  transform: Matrix2D | null,
  point: StagePoint
): StagePoint =>
  transform
    ? {
        x: transform.a * point.x + transform.c * point.y + transform.tx,
        y: transform.b * point.x + transform.d * point.y + transform.ty,
      }
    : point
