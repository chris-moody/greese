import { mix, mixText, type Mixer, type Value } from './value.ts'

/** What greese.js can animate: elements, or any object with properties. */
export type Target = Element | object

/** Targets: a selector, a target, or a list of them (NodeList, array…). */
export type Targets = string | Target | ArrayLike<Target> | null | undefined

/** Reads and writes one target's properties; writes are batched per render. */
export interface Adapter {
  get(prop: string): Value
  set(prop: string, value: Value): void
  /** Commits batched writes (transforms are composed into one write each). */
  flush(): void
  mixer(prop: string, from: Value, to: Value): Mixer
}

/** Resolves targets; selector strings match inside `scope` (the document by default). */
export const toTargets = (targets: Targets, scope?: ParentNode): Target[] => {
  if (targets == null) return []
  if (typeof targets === 'string')
    return [...(scope ?? document).querySelectorAll(targets)]
  if (
    typeof (targets as ArrayLike<Target>).length === 'number' &&
    !(targets instanceof Element)
  ) {
    return Array.from(targets as ArrayLike<Target>)
  }
  return [targets as Target]
}

/**
 * Transform shorthands, written to the individual CSS `translate`, `rotate`
 * and `scale` properties: they compose without matrix maths, and never fight
 * a `transform` set by your CSS.
 */
const TRANSFORM: Record<
  string,
  [
    property: 'translate' | 'rotate' | 'scale',
    index: number,
    unit: string,
    fallback: string,
  ]
> = {
  x: ['translate', 0, 'px', '0px'],
  y: ['translate', 1, 'px', '0px'],
  z: ['translate', 2, 'px', '0px'],
  rotate: ['rotate', 0, 'deg', '0deg'],
  scale: ['scale', -1, '', '1'],
  scaleX: ['scale', 0, '', '1'],
  scaleY: ['scale', 1, '', '1'],
}

/** CSS properties whose bare numbers mean a number, not pixels. */
const UNITLESS = new Set([
  'opacity',
  'zIndex',
  'fontWeight',
  'lineHeight',
  'flexGrow',
  'flexShrink',
  'order',
  'scale',
  'fillOpacity',
  'strokeOpacity',
  'aspectRatio',
])

const kebab = (prop: string) => prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

const elementAdapter = (el: HTMLElement | SVGElement): Adapter => {
  let computed: CSSStyleDeclaration | undefined
  const style = () => (computed ??= getComputedStyle(el))
  // Current parts of each transform property, and which changed this render.
  const parts: Record<string, string[]> = {}
  const dirty = new Set<string>()
  // Style writes wait for flush(), like transforms, so a render reads every
  // starting value before it writes anything. Written at once, each write
  // made the next computed-style read recalculate styles.
  const styles = new Map<string, string>()

  const transformParts = (property: string): string[] => {
    if (!parts[property]) {
      const current =
        el.style.getPropertyValue(property) || style().getPropertyValue(property)
      parts[property] = current && current !== 'none' ? current.split(/\s+/) : []
    }
    return parts[property]
  }

  // SVG attributes the author set (`r`, `cx`, `d`…) are animated as
  // attributes, even where a CSS property of the same name exists.
  const isAttr = (prop: string) =>
    typeof SVGElement !== 'undefined' && el instanceof SVGElement && el.hasAttribute(prop)

  const withUnit = (prop: string, value: Value, unit = 'px'): Value =>
    typeof value === 'number' && !UNITLESS.has(prop) && !prop.startsWith('--')
      ? `${value}${unit}`
      : value

  return {
    get(prop) {
      const t = TRANSFORM[prop]
      if (t) {
        const p = transformParts(t[0])
        // One-value `scale` (and `translate` with only x) apply to both axes.
        return p[t[1] < 0 ? 0 : t[1]] ?? (t[0] === 'scale' ? (p[0] ?? t[3]) : t[3])
      }
      if (prop === 'text') return el.textContent ?? ''
      if (isAttr(prop)) return el.getAttribute(prop)!
      if (prop.startsWith('--')) return style().getPropertyValue(prop).trim()
      if (prop in el.style) return style().getPropertyValue(kebab(prop))
      const own = (el as unknown as Record<string, unknown>)[prop]
      if (typeof own === 'number') return own
      return el.getAttribute(prop) ?? ''
    },
    set(prop, value) {
      const t = TRANSFORM[prop]
      if (t) {
        const p = transformParts(t[0])
        const v = String(withUnit('', value, t[2]))
        if (t[1] < 0) p.splice(0, 2, v, v)
        else {
          // Fill skipped axes so `y` alone still lands in the second slot.
          for (let i = p.length; i < t[1]; i++)
            p[i] = t[0] === 'scale' ? (p[0] ?? '1') : '0px'
          p[t[1]] = v
        }
        dirty.add(t[0])
      } else if (prop === 'text') el.textContent = String(value)
      else if (isAttr(prop)) el.setAttribute(prop, String(value))
      else if (prop.startsWith('--')) styles.set(prop, String(value))
      else if (prop in el.style) styles.set(kebab(prop), String(withUnit(prop, value)))
      else if (typeof (el as unknown as Record<string, unknown>)[prop] === 'number') {
        ;(el as unknown as Record<string, unknown>)[prop] = Number(value)
      } else el.setAttribute(prop, String(value))
    },
    flush() {
      for (const property of dirty) styles.set(property, parts[property]!.join(' '))
      for (const [property, value] of styles) el.style.setProperty(property, value)
      dirty.clear()
      styles.clear()
    },
    mixer(prop, from, to) {
      if (prop === 'text') return mixText(from, to)
      if (isAttr(prop)) return mix(from, to)
      const t = TRANSFORM[prop]
      return mix(withUnit(prop, from, t?.[2]), withUnit(prop, to, t?.[2]))
    },
  }
}

const objectAdapter = (obj: Record<string, unknown>): Adapter => ({
  get: (prop) => obj[prop] as Value,
  set(prop, value) {
    // Keep numbers numbers: a numeric string from mix() is still a number.
    obj[prop] = typeof obj[prop] === 'number' ? Number(value) : value
  },
  flush() {},
  mixer: (prop, from, to) => (prop === 'text' ? mixText(from, to) : mix(from, to)),
})

const adapters = new WeakMap<object, Adapter>()

let batching = 0
const queued = new Set<Adapter>()

/** Commits an adapter's writes, or queues them while a batch is open. */
export const flushAdapter = (adapter: Adapter): void => {
  if (batching) queued.add(adapter)
  else adapter.flush()
}

/**
 * Runs `fn` with every timeline's writes held until it returns, so all of
 * them read their starting values before any of them writes. Rendering many
 * timelines one after another otherwise recalculates styles once per
 * timeline. The ticker batches every frame; batch your own bursts, such as
 * starting many animations at once. Reads made inside `fn` (in `onUpdate`,
 * say) see values from before the batch.
 */
export const batch = (fn: () => void): void => {
  batching++
  try {
    fn()
  } finally {
    if (!--batching) {
      for (const adapter of queued) adapter.flush()
      queued.clear()
    }
  }
}

/** One adapter per target, shared by every timeline that animates it. */
export const adapterFor = (target: Target): Adapter => {
  let adapter = adapters.get(target)
  if (!adapter) {
    adapter =
      typeof Element !== 'undefined' && target instanceof Element
        ? elementAdapter(target as HTMLElement)
        : objectAdapter(target as Record<string, unknown>)
    adapters.set(target, adapter)
  }
  return adapter
}
