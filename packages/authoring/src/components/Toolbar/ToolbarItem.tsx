'use client'
import {
  useRef,
  useState,
  type FocusEventHandler,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx, IconButton, Menu, MenuItem, Tooltip } from '@greese/react'
import { ChevronRightIcon } from '@greese/icons'
import { toolTitle, type ToolInfo } from '../../core/tools/tools.ts'

/** A tool the toolbar draws: the registry's data, plus its icon. */
export interface ToolDefinition<Id extends string = string> extends ToolInfo<Id> {
  /** Its button's icon, also drawn as its stage cursor. */
  icon: ReactNode
  /** Makes this a group: one button for the last of these used, the rest in a flyout. */
  subTools?: readonly ToolDefinition<Id>[]
}

export interface ToolbarItemProps<Id extends string = string> {
  /** The tool, or the group, this button is for. */
  tool: ToolDefinition<Id>
  /** The editor's active tool: this button is pressed while it, or one of its group, is. */
  value: Id
  /** Called with the tool's id when it's chosen, from the button or the flyout. */
  onSelect: (id: Id) => void
  /** The toolbar's direction: a group's flyout opens across it. @default 'vertical' */
  orientation?: 'vertical' | 'horizontal'
  /** The toolbar's roving tab stop: 0 on one button, -1 on the rest. @default 0 */
  tabIndex?: number
  /** Called when the button takes focus, so the toolbar can move its tab stop here. */
  onFocus?: FocusEventHandler<HTMLButtonElement>
}

/**
 * One button of a `Toolbar`. A plain tool's button picks it. A group's
 * button picks the group's last-used tool and shows its icon; the corner
 * arrow, a right-click, or the arrow key across the toolbar opens the rest of
 * the group.
 *
 * ```tsx
 * <ToolbarItem tool={shapes} value={tool} onSelect={setTool} />
 * ```
 */
export const ToolbarItem = <Id extends string = string>({
  tool,
  value,
  onSelect,
  orientation = 'vertical',
  tabIndex = 0,
  onFocus,
}: ToolbarItemProps<Id>): JSX.Element => {
  const group = tool.subTools
  const inGroup = !!group?.some((sub) => sub.id === value)
  const [last, setLast] = useState(group?.[0]?.id)
  // Remember the group's tool while it's active, so the button keeps showing
  // it after another tool is picked: set during render, React's pattern for
  // state that follows a prop.
  if (inGroup && last !== value) setLast(value)
  const current = group ? (group.find((sub) => sub.id === last) ?? group[0]!) : tool
  const pressed = group ? inGroup : value === tool.id

  const button = useRef<HTMLButtonElement>(null)
  const flyout = useRef<HTMLButtonElement>(null)
  // The flyout's trigger is a corner arrow outside the toolbar's tab order;
  // clicking it from the keyboard opens the menu, and Menu focuses the first
  // item itself.
  const openFlyout = () => flyout.current?.click()

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const across = orientation === 'vertical' ? 'ArrowRight' : 'ArrowDown'
    if (group && event.key === across) {
      event.preventDefault()
      openFlyout()
    }
  }

  return (
    <div
      className={cx('greese-ToolbarItem', group && 'greese-ToolbarItem--group')}
      data-tool={current.id}
    >
      <Tooltip
        content={toolTitle(current)}
        placement={orientation === 'vertical' ? 'end' : 'bottom'}
      >
        <IconButton
          ref={button}
          size="sm"
          label={current.label}
          className="greese-ToolbarItem-button"
          data-greese-toolbar-item=""
          tabIndex={tabIndex}
          aria-pressed={pressed}
          aria-keyshortcuts={current.hotkey?.toUpperCase()}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onClick={() => onSelect(current.id)}
          onContextMenu={
            group &&
            ((event) => {
              event.preventDefault()
              openFlyout()
            })
          }
        >
          {current.icon}
        </IconButton>
      </Tooltip>
      {group && (
        <Menu
          placement={orientation === 'vertical' ? 'end' : 'bottom-start'}
          // Back to the group's button, which holds the toolbar's tab stop,
          // rather than the arrow, which a pointer may have focused.
          onOpenChange={(open) => !open && button.current?.focus()}
          trigger={
            <button
              ref={flyout}
              type="button"
              tabIndex={-1}
              className="greese-ToolbarItem-flyout"
              aria-label={`${tool.label} tools`}
            >
              <ChevronRightIcon aria-hidden="true" />
            </button>
          }
        >
          {group.map((sub) => (
            <MenuItem
              key={sub.id}
              aria-current={sub.id === value || undefined}
              aria-keyshortcuts={sub.hotkey?.toUpperCase()}
              onSelect={() => onSelect(sub.id)}
            >
              {sub.icon}
              {toolTitle(sub)}
            </MenuItem>
          ))}
        </Menu>
      )}
    </div>
  )
}
