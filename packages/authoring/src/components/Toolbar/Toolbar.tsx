'use client'
import {
  Fragment,
  useState,
  type ComponentPropsWithRef,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx, Divider } from '@greese/react'
import { ToolbarItem, type ToolDefinition } from './ToolbarItem.tsx'

export interface ToolbarProps<Id extends string = string> extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'onChange'
> {
  /** The tools, in order; a change of `group` draws a separator. */
  tools: readonly ToolDefinition<Id>[]
  /** The active tool's id. */
  value: Id
  /** Called with a tool's id when it's chosen. */
  onValueChange: (id: Id) => void
  /** Which way the tools run; the arrow keys follow it. @default 'vertical' */
  orientation?: 'vertical' | 'horizontal'
  /** The toolbar's accessible name. @default 'Tools' */
  label?: string
  /** Controls after the tools, such as a color well: each keeps its own tab stop. */
  children?: ReactNode
}

/**
 * An editor's tool palette, per the WAI-ARIA toolbar pattern: one tab stop,
 * the arrow keys (and Home and End) move between tools, and the active tool's
 * button is pressed. A group shares one button and opens a flyout of its
 * tools. The tools are data (`ToolDefinition`), the same list the hotkeys
 * (`useToolHotkeys`) and stage cursors (`createToolCursors`) come from.
 *
 * ```tsx
 * <Toolbar tools={tools} value={tool} onValueChange={setTool} />
 * ```
 */
export const Toolbar = <Id extends string = string>({
  tools,
  value,
  onValueChange,
  orientation = 'vertical',
  label = 'Tools',
  className,
  onKeyDown,
  children,
  ...props
}: ToolbarProps<Id>): JSX.Element => {
  const holder = (id: Id) =>
    tools.find((tool) => tool.id === id || tool.subTools?.some((sub) => sub.id === id))
  // The tab stop is the button last focused, else the active tool's, so
  // Tab leaves the toolbar from where the arrows left off.
  const [focused, setFocused] = useState<string>()
  const stop =
    (focused && tools.some((tool) => tool.id === focused) && focused) ||
    (holder(value) ?? tools[0])?.id

  const onArrows = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const [back, forward] =
      orientation === 'vertical' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLElement>('[data-greese-toolbar-item]'),
    ]
    const at = items.indexOf(document.activeElement as HTMLElement)
    if (at < 0) return
    const next =
      event.key === forward
        ? (at + 1) % items.length
        : event.key === back
          ? (at - 1 + items.length) % items.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? items.length - 1
              : -1
    if (next < 0) return
    event.preventDefault()
    items[next]!.focus()
  }

  return (
    <div
      {...props}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      className={cx('greese-Toolbar', `greese-Toolbar--${orientation}`, className)}
      onKeyDown={onArrows}
    >
      {tools.map((tool, index) => (
        <Fragment key={tool.id}>
          {index > 0 && tool.group !== tools[index - 1]!.group && (
            <Divider
              className="greese-Toolbar-separator"
              orientation={orientation === 'vertical' ? 'horizontal' : 'vertical'}
            />
          )}
          <ToolbarItem
            tool={tool}
            value={value}
            onSelect={onValueChange}
            orientation={orientation}
            tabIndex={tool.id === stop ? 0 : -1}
            onFocus={() => setFocused(tool.id)}
          />
        </Fragment>
      ))}
      {children}
    </div>
  )
}
