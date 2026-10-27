import { vi } from 'vitest'

/**
 * A fake IntersectionObserver for jsdom, which has none. Install it before
 * rendering; `intersect()` then plays a scroll, handing each connected
 * observer an entry for every element it watches.
 */
interface Observer {
  callback: IntersectionObserverCallback
  targets: Element[]
  connected: boolean
}

const observers: Observer[] = []

class FakeIntersectionObserver {
  readonly #record: Observer
  constructor(callback: IntersectionObserverCallback) {
    this.#record = { callback, targets: [], connected: true }
    observers.push(this.#record)
  }
  observe(target: Element): void {
    this.#record.targets.push(target)
  }
  unobserve(target: Element): void {
    this.#record.targets = this.#record.targets.filter((t) => t !== target)
  }
  disconnect(): void {
    this.#record.connected = false
  }
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

export const installIntersectionObserver = (): void => {
  observers.length = 0
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
}

/**
 * Delivers `entry` to every connected observer, once per element it watches
 * (or only for `target`). Wrap it in `act()` when React state follows.
 */
export const intersect = (
  entry: Partial<IntersectionObserverEntry>,
  { target }: { target?: Element } = {}
): void => {
  for (const o of observers.filter((o) => o.connected)) {
    for (const t of o.targets) {
      if (target && t !== target) continue
      o.callback(
        [{ target: t, ...entry } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    }
  }
}

/** How many observers are still watching. */
export const watching = (): number => observers.filter((o) => o.connected).length
