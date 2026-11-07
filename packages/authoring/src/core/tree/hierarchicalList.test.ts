import { describe, expect, it } from 'vitest'
import {
  collectDescendantIds,
  flattenVisibleOrder,
  moveItemsIntoFolder,
  reorderItems,
} from './hierarchicalList.ts'
import {
  DropTargetPosition,
  FOLDER_TYPE,
  type TreeItemModel,
} from '../types/tree.types.ts'

const item = (id: string, extra: Partial<TreeItemModel> = {}): TreeItemModel => ({
  id,
  name: id,
  ...extra,
})

const build = (list: TreeItemModel[]) => new Map(list.map((i) => [i.id, i]))

describe('reorderItems', () => {
  it('moves an item below a target at the root', () => {
    const items = build([item('a'), item('b'), item('c')])
    const result = reorderItems(
      items,
      ['a', 'b', 'c'],
      ['a'],
      'c',
      DropTargetPosition.BELOW
    )
    expect(result.itemOrder).toEqual(['b', 'c', 'a'])
  })

  it('is a no-op when dropping onto itself', () => {
    const items = build([item('a'), item('b')])
    const result = reorderItems(items, ['a', 'b'], ['a'], 'a', DropTargetPosition.BELOW)
    expect(result.itemOrder).toEqual(['a', 'b'])
  })
})

describe('moveItemsIntoFolder', () => {
  it('moves an item into a folder and reparents it', () => {
    const items = build([item('f', { type: FOLDER_TYPE, children: [] }), item('a')])
    const result = moveItemsIntoFolder(items, ['f', 'a'], ['a'], 'f')
    expect(result.itemOrder).toEqual(['f'])
    const folderUpdate = result.updates.find((u) => u.id === 'f')
    expect(folderUpdate?.updates.children).toEqual(['a'])
    const parentUpdate = result.updates.find((u) => u.id === 'a')
    expect(parentUpdate?.updates.parent).toBe('f')
  })
})

describe('flattenVisibleOrder', () => {
  it('includes children of expanded folders', () => {
    const items = build([
      item('f', { type: FOLDER_TYPE, children: ['a'] }),
      item('a', { parent: 'f' }),
    ])
    expect(flattenVisibleOrder(items, ['f'], new Set())).toEqual(['f', 'a'])
  })

  it('skips children of collapsed folders', () => {
    const items = build([
      item('f', { type: FOLDER_TYPE, children: ['a'] }),
      item('a', { parent: 'f' }),
    ])
    expect(flattenVisibleOrder(items, ['f'], new Set(['f']))).toEqual(['f'])
  })

  it('expands non-folder nodes with children when not collapsed', () => {
    const items = build([
      item('bone', { children: ['child'] }),
      item('child', { parent: 'bone' }),
    ])
    expect(flattenVisibleOrder(items, ['bone'], new Set())).toEqual(['bone', 'child'])
  })

  it('skips children of a collapsed non-folder node too — any node with children is collapsible', () => {
    const items = build([
      item('bone', { children: ['child'] }),
      item('child', { parent: 'bone' }),
    ])
    expect(flattenVisibleOrder(items, ['bone'], new Set(['bone']))).toEqual(['bone'])
  })
})

describe('collectDescendantIds', () => {
  it('returns every nested descendant, not just direct children', () => {
    const items = build([
      item('f', { type: FOLDER_TYPE, children: ['a', 'g'] }),
      item('a', { parent: 'f' }),
      item('g', { type: FOLDER_TYPE, parent: 'f', children: ['b'] }),
      item('b', { parent: 'g' }),
    ])
    expect(collectDescendantIds(items, 'f').sort()).toEqual(['a', 'b', 'g'].sort())
  })

  it('returns an empty array for a childless item', () => {
    const items = build([item('a')])
    expect(collectDescendantIds(items, 'a')).toEqual([])
  })

  it('returns an empty array for an unknown id', () => {
    const items = build([item('a')])
    expect(collectDescendantIds(items, 'missing')).toEqual([])
  })
})
