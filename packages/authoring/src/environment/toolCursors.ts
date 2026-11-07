'use client'
import type { ReactNode } from 'react'
import { flattenTools } from '../core/tools/tools.ts'
import type { ToolDefinition } from '../components/Toolbar/ToolbarItem.tsx'
import { buildToolCursorCss } from './toolCursorCss.ts'

/**
 * A tool's stage cursor, as a CSS `cursor` value: its toolbar icon beside a
 * pointer. `variant` names one of the tool's `variants`, a different icon for
 * a held modifier (Zoom's zoom-out while Alt is down).
 */
export type ToolCursor<Id extends string> = (id: Id, variant?: string) => string

/**
 * Builds every tool's stage cursor from the toolbar's list, once each and on
 * first use: the three studios each kept a copy of this cache. A tool marked
 * `cursor: false`, or one the list doesn't have, keeps the native pointer
 * (`'default'`).
 *
 * ```ts
 * const cursorFor = createToolCursors(tools, { zoom: { out: <ZoomOutIcon /> } })
 * canvas.style.cursor = cursorFor(tool, altKey ? 'out' : undefined)
 * ```
 */
export const createToolCursors = <Id extends string>(
  tools: readonly ToolDefinition<Id>[],
  variants: Partial<Record<Id, Record<string, ReactNode>>> = {}
): ToolCursor<Id> => {
  const byId = new Map(flattenTools(tools).map((tool) => [tool.id, tool]))
  const cache = new Map<string, string>()
  return (id, variant) => {
    const tool = byId.get(id)
    if (!tool || tool.cursor === false) return 'default'
    const key = `${id}:${variant ?? ''}`
    let css = cache.get(key)
    if (css === undefined) {
      const icon = (variant && variants[id]?.[variant]) || tool.icon
      css = buildToolCursorCss(icon)
      cache.set(key, css)
    }
    return css
  }
}
