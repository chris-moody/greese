/**
 * An editor's tools, as data: one registry that the toolbar draws, the
 * hotkeys come from and the stage cursors are built from. Glop's studios each
 * kept a tool list and parsed their hotkeys back out of its tooltip text, in
 * three copies; here the hotkey is a field of its own.
 */

/** A tool, or a group of them that shares one toolbar button. */
export interface ToolInfo<Id extends string = string> {
  /** What the editor stores as its active tool. A group's id is never active. */
  id: Id
  /** The tool's name: its button's label and tooltip, and the Tool Options tab. */
  label: string
  /** What it does and how to use it, for the Tool Options panel's info. */
  description?: string
  /** One key that picks it, case-insensitive: `'v'`. */
  hotkey?: string
  /** Tools in different groups are drawn apart, with a separator between. */
  group?: string
  /** `false` keeps the native pointer over the stage instead of the tool's icon. */
  cursor?: boolean
  /** Makes this a group: one button, with its tools in a flyout. */
  subTools?: readonly ToolInfo<Id>[]
}

/** The tools that can be active: every tool, with each group replaced by its own. */
export const flattenTools = <T extends ToolInfo>(tools: readonly T[]): T[] =>
  tools.flatMap((tool) =>
    tool.subTools ? flattenTools(tool.subTools as readonly T[]) : [tool]
  )

/** The tool with this id, inside a group or not. */
export const findTool = <T extends ToolInfo>(
  tools: readonly T[],
  id: string
): T | undefined => flattenTools(tools).find((tool) => tool.id === id)

/**
 * Each hotkey, lower-cased, and the tool it picks. Two tools on one key is a
 * mistake in the registry, so it throws rather than letting one silently win.
 */
export const buildToolHotkeys = <Id extends string>(
  tools: readonly ToolInfo<Id>[]
): ReadonlyMap<string, Id> => {
  const hotkeys = new Map<string, Id>()
  for (const tool of flattenTools(tools)) {
    if (!tool.hotkey) continue
    const key = tool.hotkey.toLowerCase()
    const taken = hotkeys.get(key)
    if (taken) {
      throw new Error(`Tool hotkey "${key}" is used by both ${taken} and ${tool.id}`)
    }
    hotkeys.set(key, tool.id)
  }
  return hotkeys
}

/** A tool's name with its hotkey, for a tooltip: `Select (V)`. */
export const toolTitle = (tool: Pick<ToolInfo, 'label' | 'hotkey'>): string =>
  tool.hotkey ? `${tool.label} (${tool.hotkey.toUpperCase()})` : tool.label

/** Whether typing there is text, so a letter must not switch tools. */
export const isEditableTarget = (target: unknown): boolean => {
  const element = target as Partial<HTMLElement> | null
  if (!element || typeof element.tagName !== 'string') return false
  return (
    !!element.isContentEditable ||
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT'
  )
}

/** The parts of a keyboard event a hotkey looks at. */
export interface HotkeyEventLike {
  key: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  repeat?: boolean
  target?: unknown
}

/**
 * The tool a key press picks, if any. A held key's repeats, a key with a
 * modifier (those belong to commands: ⌘Z, Shift-click) and typing in a field
 * pick nothing.
 */
export const toolForKey = <Id extends string>(
  hotkeys: ReadonlyMap<string, Id>,
  event: HotkeyEventLike
): Id | undefined => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return undefined
  }
  if (isEditableTarget(event.target)) return undefined
  return hotkeys.get(event.key.toLowerCase())
}
