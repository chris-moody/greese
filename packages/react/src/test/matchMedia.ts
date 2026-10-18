/**
 * A controllable window.matchMedia for jsdom, which has none. Lists are live:
 * `matches` reads the current fake environment, and setMedia() fires `change`
 * on every list whose result flipped.
 */
interface Env {
  width: number
  dark: boolean
  reducedMotion: boolean
}

const env: Env = { width: 1024, dark: false, reducedMotion: false }
const lists: FakeList[] = []

const evaluate = (query: string): boolean => {
  const min = /\(min-width:\s*(\d+)px\)/.exec(query)
  if (min) return env.width >= Number(min[1])
  if (query.includes('prefers-color-scheme: dark')) return env.dark
  if (query.includes('prefers-reduced-motion: reduce')) return env.reducedMotion
  return false
}

class FakeList extends EventTarget {
  readonly media: string
  last: boolean
  onchange = null
  constructor(media: string) {
    super()
    this.media = media
    this.last = evaluate(media)
  }
  get matches(): boolean {
    return evaluate(this.media)
  }
  addListener(): void {}
  removeListener(): void {}
}

export const installMatchMedia = (): void => {
  window.matchMedia = (query: string) => {
    const list = new FakeList(query)
    lists.push(list)
    return list as unknown as MediaQueryList
  }
}

export const setMedia = (next: Partial<Env>): void => {
  Object.assign(env, next)
  for (const list of lists) {
    if (list.matches !== list.last) {
      list.last = list.matches
      list.dispatchEvent(new Event('change'))
    }
  }
}
