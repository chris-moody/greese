import { glob, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { purgeUtilities, type PurgeOptions } from './utilities.ts'

/** Folders never scanned: their text isn't the project's markup. */
const SKIPPED = new Set(['node_modules', '.git', 'dist', 'build', 'coverage'])

export interface ContentOptions {
  /** Glob patterns of the files that use the classes, relative to `cwd`. */
  content: readonly string[]
  /** Where the patterns start. @default process.cwd() */
  cwd?: string
}

/** The files the patterns match, as absolute paths. */
export const contentFiles = async ({ content, cwd = process.cwd() }: ContentOptions) => {
  const files = new Set<string>()
  for (const pattern of content)
    for await (const file of glob(pattern, {
      cwd,
      exclude: (entry: string | { name: string }) =>
        SKIPPED.has(typeof entry === 'string' ? entry : entry.name),
    }))
      files.add(resolve(cwd, file))
  return [...files].sort()
}

/**
 * The utilities a project uses: reads the files the patterns match and keeps
 * only the classes they spell out. Returns the CSS and the files it read (for
 * watching).
 */
export const purgeFiles = async ({
  content,
  cwd,
  ...options
}: ContentOptions & Omit<PurgeOptions, 'content'>) => {
  const files = await contentFiles({ content, cwd })
  const texts = await Promise.all(files.map((file) => readFile(file, 'utf8')))
  return { css: purgeUtilities({ ...options, content: texts }), files }
}
