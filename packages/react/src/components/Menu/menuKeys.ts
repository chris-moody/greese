import type { KeyboardEvent } from 'react'
import { listTarget } from '../../utils/listTarget.ts'

/** The items the keyboard moves between, skipping disabled ones. */
export const menuItems = (menu: HTMLElement): HTMLElement[] =>
  Array.from(
    menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
  )

/**
 * The menu keyboard pattern, shared by Menu and ContextMenu: arrows and
 * Home/End move focus, Tab closes, and a printable character jumps to the next
 * item starting with it.
 *
 * Returns whether it handled the key, so the caller can decide what closing
 * means for it — a Menu returns focus to its trigger, a ContextMenu to
 * wherever focus was.
 */
export const moveMenuFocus = (
  event: KeyboardEvent<HTMLElement>,
  close: () => void
): boolean => {
  const list = menuItems(event.currentTarget)
  const at = list.indexOf(document.activeElement as HTMLElement)
  const target = listTarget(event.key, at, list.length)

  if (target !== undefined) list[target]?.focus()
  else if (event.key === 'Tab') {
    close()
    return true
  } else if (event.key.length === 1 && /\S/.test(event.key)) {
    // Type-ahead: next item starting with the typed character.
    const key = event.key.toLowerCase()
    const order = [...list.slice(at + 1), ...list.slice(0, at + 1)]
    order.find((item) => item.textContent?.trim().toLowerCase().startsWith(key))?.focus()
  } else return false

  event.preventDefault()
  return true
}
