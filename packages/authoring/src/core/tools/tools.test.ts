import { describe, expect, it } from 'vitest'
import {
  buildToolHotkeys,
  findTool,
  flattenTools,
  isEditableTarget,
  toolForKey,
  toolTitle,
  type ToolInfo,
} from './tools.ts'

const tools: ToolInfo[] = [
  { id: 'select', label: 'Select', hotkey: 'v', cursor: false },
  {
    id: 'shapes',
    label: 'Shapes',
    subTools: [
      { id: 'rect', label: 'Rectangle', hotkey: 'R' },
      { id: 'ellipse', label: 'Ellipse', hotkey: 'e' },
    ],
  },
  { id: 'zoom', label: 'Zoom' },
]

const key = (k: string, extra: Partial<Parameters<typeof toolForKey>[1]> = {}) => ({
  key: k,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...extra,
})

describe('tool registry', () => {
  it('flattens groups into the tools they hold', () => {
    expect(flattenTools(tools).map((t) => t.id)).toEqual([
      'select',
      'rect',
      'ellipse',
      'zoom',
    ])
    expect(findTool(tools, 'ellipse')?.label).toBe('Ellipse')
    expect(findTool(tools, 'shapes')).toBeUndefined()
  })

  it('maps lower-cased hotkeys to tools, and refuses a key used twice', () => {
    expect([...buildToolHotkeys(tools)]).toEqual([
      ['v', 'select'],
      ['r', 'rect'],
      ['e', 'ellipse'],
    ])
    expect(() =>
      buildToolHotkeys([...tools, { id: 'rotate', label: 'Rotate', hotkey: 'r' }])
    ).toThrow('Tool hotkey "r" is used by both rect and rotate')
  })

  it('titles a tool with its hotkey', () => {
    expect(toolTitle({ label: 'Rectangle', hotkey: 'r' })).toBe('Rectangle (R)')
    expect(toolTitle({ label: 'Zoom' })).toBe('Zoom')
  })

  it('picks a tool from a plain key press only', () => {
    const hotkeys = buildToolHotkeys(tools)
    expect(toolForKey(hotkeys, key('R'))).toBe('rect')
    expect(toolForKey(hotkeys, key('z'))).toBeUndefined()
    expect(toolForKey(hotkeys, key('v', { metaKey: true }))).toBeUndefined()
    expect(toolForKey(hotkeys, key('v', { shiftKey: true }))).toBeUndefined()
    expect(toolForKey(hotkeys, key('v', { repeat: true }))).toBeUndefined()
    expect(
      toolForKey(hotkeys, key('v', { target: { tagName: 'INPUT' } }))
    ).toBeUndefined()
  })

  it('treats fields and editable content as typing', () => {
    expect(isEditableTarget({ tagName: 'TEXTAREA' })).toBe(true)
    expect(isEditableTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true)
    expect(isEditableTarget({ tagName: 'BUTTON' })).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
  })
})
