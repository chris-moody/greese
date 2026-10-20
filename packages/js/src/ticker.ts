import { batch } from './target.ts'

/** Anything the ticker can advance: top-level timelines. */
export interface Tickable {
  tick(dt: number): void
}

const active = new Set<Tickable>()
let frame = 0
let last = 0

// One requestAnimationFrame loop for every playing timeline, running only
// while something plays. A long gap (a background tab) counts as one frame
// of at most 1/30 s, so animations resume where they were instead of jumping.
const loop = (now: number) => {
  const dt = Math.min((now - last) / 1000, 1 / 30)
  last = now
  // One batch per frame: every timeline reads, then every timeline writes.
  batch(() => {
    for (const item of [...active]) item.tick(dt)
  })
  frame = active.size ? requestAnimationFrame(loop) : 0
}

export const addToTicker = (item: Tickable): void => {
  active.add(item)
  if (!frame && typeof requestAnimationFrame !== 'undefined') {
    last = performance.now()
    frame = requestAnimationFrame(loop)
  }
}

export const removeFromTicker = (item: Tickable): void => {
  active.delete(item)
}
