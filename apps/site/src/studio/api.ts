import type { ImportResult } from './importer.ts'
import type { ErrorAt } from './scssModule.ts'
import type { ThemeSpec } from './spec.ts'

/** What to import: text (pasted or uploaded) or a file in the project. */
export type ImportSource =
  | { text: string; filename?: string; format?: 'json' | 'css' | 'scss'; theme?: string }
  | { path: string; theme?: string }

export interface Compiled {
  scss?: string
  css?: string
  /** The theme's effects as a module for the app; absent while it has none. */
  effects?: string
  /** `css` is the whole stylesheet, built for the theme's own breakpoints. */
  full?: boolean
  errors?: string[]
  /** When the error is in a component's SCSS: where, to mark the line in its box. */
  at?: ErrorAt
}

export interface Loaded extends Compiled {
  file: string
  outputs: string[]
  spec: ThemeSpec
}

const json = async <T>(response: Response): Promise<T> => {
  if (!response.headers.get('content-type')?.includes('json'))
    throw new Error('The studio API is only available from `npm run studio`.')
  return (await response.json()) as T
}

const send = (method: string, url: string, spec: ThemeSpec) =>
  fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(spec),
  }).then((r) => json<Compiled & { written?: string[]; kept?: string[] }>(r))

/**
 * True when built (GitHub Pages): no dev server, so the studio works in the
 * browser instead (`hosted.ts`, loaded only then).
 */
export const hosted = !import.meta.env.DEV

const devApi = {
  load: () => fetch('/api/theme').then((r) => json<Loaded>(r)),
  compile: (spec: ThemeSpec) => send('POST', '/api/compile', spec),
  save: (spec: ThemeSpec) => send('PUT', '/api/theme', spec),
  import: (source: ImportSource) =>
    fetch('/api/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(source),
    }).then((r) => json<ImportResult | { errors: string[] }>(r)),
}

const browser = () => import('./hosted.ts').then((m) => m.hostedApi)

export const api: typeof devApi = hosted
  ? {
      load: async () => (await browser()).load(),
      compile: async (spec) => (await browser()).compile(spec),
      save: async (spec) => (await browser()).save(spec),
      import: async (source) => (await browser()).import(source),
    }
  : devApi
