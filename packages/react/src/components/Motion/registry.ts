import type { GreeseOptions } from '../../utils/greese.ts'

/** The client runtime behind the `greese` prop: see greeseRuntime.ts. */
export interface GreeseRuntime {
  attach(el: HTMLElement, options: GreeseOptions): () => void
}

let registered: Promise<GreeseRuntime> | undefined

/**
 * Called by `import '@greese-ui/react/greese'`: the runtime is then in the
 * main bundle and attaches before the first paint, so JavaScript entrances
 * never flash. Without it, the runtime loads on first use, as its own chunk.
 */
export const registerGreeseRuntime = (runtime: GreeseRuntime): void => {
  registered = Promise.resolve(runtime)
}

export const loadGreeseRuntime = (): Promise<GreeseRuntime> =>
  (registered ??= import('./greeseRuntime.ts'))
