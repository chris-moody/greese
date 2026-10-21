import type { Keyframes } from '@greese/js'
import type { GreeseOptions } from '../../utils/greese.ts'

/** The client runtime behind the `greese` prop: see greeseRuntime.ts. */
export interface GreeseRuntime {
  /** Attaches each element's options and stores its cleanup on it. */
  attachAll(
    items: Array<{ el: HTMLElement; options: GreeseOptions; detach?: () => void }>
  ): void
  /** The built-in effects as plain keyframes. */
  effectFrames(distance?: string): Record<string, Keyframes>
}

/** The lazy half of the `scope` option: see scope.ts. */
export interface GreeseScopes {
  attachScopes(
    items: Array<{ el: HTMLElement; options: GreeseOptions; detach?: () => void }>
  ): void
}

let registered: Promise<GreeseRuntime> | undefined
let registeredScopes: Promise<GreeseScopes> | undefined

/**
 * Called by `import '@greese/react/greese'`: the runtime is then in the
 * main bundle and attaches before the first paint, so JavaScript entrances
 * never flash. Without it, the runtime loads on first use, as its own chunk.
 */
export const registerGreeseRuntime = (runtime: GreeseRuntime): void => {
  registered = Promise.resolve(runtime)
}

/** Like `registerGreeseRuntime`, for scopes. */
export const registerGreeseScopes = (scopes: GreeseScopes): void => {
  registeredScopes = Promise.resolve(scopes)
}

export const loadGreeseScopes = (): Promise<GreeseScopes> =>
  (registeredScopes ??= import('./scope.ts'))

export const loadGreeseRuntime = (): Promise<GreeseRuntime> =>
  (registered ??= import('./greeseRuntime.ts'))

/**
 * Every built-in effect as plain keyframes, by name, with `distance` resolved
 * (default `'1rem'`) and left to right: for showing or editing effects in a
 * tool. Loads the runtime chunk.
 */
export const describeGreeseEffects = (
  distance?: string
): Promise<Record<string, Keyframes>> =>
  loadGreeseRuntime().then((runtime) => runtime.effectFrames(distance))
