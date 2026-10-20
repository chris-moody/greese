import type { ImportResult } from './importer.ts'
import type { ThemeSpec } from './spec.ts'

/** What to import: text (pasted or uploaded) or a file in the project. */
export type ImportSource =
  | { text: string; filename?: string; format?: 'json' | 'css' | 'scss'; theme?: string }
  | { path: string; theme?: string }

export interface Compiled {
  scss?: string
  css?: string
  errors?: string[]
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
  }).then((r) => json<Compiled & { written?: string[] }>(r))

export const api = {
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
