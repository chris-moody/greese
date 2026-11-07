'use client'
import { useEffect, useMemo, useRef } from 'react'
import { buildToolHotkeys, toolForKey, type ToolInfo } from '../core/tools/tools.ts'

export interface UseToolHotkeysOptions {
  /** Where key presses are heard. @default window */
  target?: EventTarget | null
  /** Turns the hotkeys off, while a dialog is open or text is being edited on the stage. */
  disabled?: boolean
}

/**
 * Picks a tool when its `hotkey` is pressed, anywhere but in a text field,
 * and without a modifier, which belongs to commands. The tools are the
 * toolbar's own list, so a hint and its key can't drift apart.
 *
 * ```tsx
 * useToolHotkeys(tools, setTool)
 * ```
 */
export const useToolHotkeys = <Id extends string>(
  tools: readonly ToolInfo<Id>[],
  onSelect: (id: Id) => void,
  { target, disabled }: UseToolHotkeysOptions = {}
): void => {
  const hotkeys = useMemo(() => buildToolHotkeys(tools), [tools])
  // The latest callback, without re-subscribing when an inline one changes.
  const select = useRef(onSelect)
  useEffect(() => {
    select.current = onSelect
  })

  useEffect(() => {
    if (disabled) return
    const source = target === undefined ? window : target
    if (!source) return
    const onKey = (event: Event) => {
      const keyEvent = event as KeyboardEvent
      if (keyEvent.defaultPrevented) return
      const id = toolForKey(hotkeys, keyEvent)
      if (id === undefined) return
      keyEvent.preventDefault()
      select.current(id)
    }
    source.addEventListener('keydown', onKey)
    return () => source.removeEventListener('keydown', onKey)
  }, [hotkeys, target, disabled])
}
