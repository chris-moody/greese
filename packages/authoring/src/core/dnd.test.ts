import { describe, expect, it } from 'vitest'
import type { DropLike } from './dnd.ts'
import {
  extractDraggedIds,
  extractDroppedImageFiles,
  extractDroppedJsonFiles,
  extractDroppedSvgFiles,
} from './dnd.ts'

/** A minimal fake `DragEvent` — real `DragEvent`/`DataTransfer` construction is unreliable across jsdom versions; `extractDroppedImageFiles` only ever reads `event.dataTransfer.files`, so this is all a test needs to shape. */
const fakeDropEvent = (files: File[]): DropLike =>
  ({ dataTransfer: { files } }) as unknown as DropLike

describe('extractDroppedImageFiles', () => {
  it('returns image files from a mixed-type drop', () => {
    const png = new File(['x'], 'a.png', { type: 'image/png' })
    const txt = new File(['x'], 'b.txt', { type: 'text/plain' })
    const jpg = new File(['x'], 'c.jpg', { type: 'image/jpeg' })
    expect(extractDroppedImageFiles(fakeDropEvent([png, txt, jpg]))).toEqual([png, jpg])
  })

  it('returns an empty array when no files are present', () => {
    expect(extractDroppedImageFiles(fakeDropEvent([]))).toEqual([])
  })

  it('returns an empty array when no dropped file is an image', () => {
    const txt = new File(['x'], 'b.txt', { type: 'text/plain' })
    const pdf = new File(['x'], 'c.pdf', { type: 'application/pdf' })
    expect(extractDroppedImageFiles(fakeDropEvent([txt, pdf]))).toEqual([])
  })
})

describe('extractDroppedJsonFiles', () => {
  it('returns JSON files (by MIME type) from a mixed-type drop', () => {
    const json = new File(['{}'], 'a.json', { type: 'application/json' })
    const png = new File(['x'], 'b.png', { type: 'image/png' })
    expect(extractDroppedJsonFiles(fakeDropEvent([json, png]))).toEqual([json])
  })

  it('matches a .json filename even when the browser reports a different/empty MIME type', () => {
    const json = new File(['{}'], 'a.json', { type: '' })
    const jsonAsText = new File(['{}'], 'b.json', { type: 'text/plain' })
    expect(extractDroppedJsonFiles(fakeDropEvent([json, jsonAsText]))).toEqual([
      json,
      jsonAsText,
    ])
  })

  it('matches the filename extension case-insensitively', () => {
    const json = new File(['{}'], 'a.JSON', { type: '' })
    expect(extractDroppedJsonFiles(fakeDropEvent([json]))).toEqual([json])
  })

  it('returns an empty array when no dropped file is JSON', () => {
    const png = new File(['x'], 'b.png', { type: 'image/png' })
    const txt = new File(['x'], 'c.txt', { type: 'text/plain' })
    expect(extractDroppedJsonFiles(fakeDropEvent([png, txt]))).toEqual([])
  })

  it('returns an empty array when no files are present', () => {
    expect(extractDroppedJsonFiles(fakeDropEvent([]))).toEqual([])
  })
})

const dragOf = (data: Record<string, string>): DropLike =>
  ({
    dataTransfer: { getData: (key: string) => data[key] ?? '', files: [] },
  }) as unknown as DropLike

describe('extractDraggedIds', () => {
  it('reads the one dragged row, or every selected row', () => {
    expect(extractDraggedIds(dragOf({ itemId: 'a' }))).toEqual(['a'])
    expect(
      extractDraggedIds(dragOf({ itemId: 'a', selectedItems: '["a","b"]' }))
    ).toEqual(['a', 'b'])
  })

  it('reads nothing from another kind of drag, or a malformed one', () => {
    expect(extractDraggedIds(dragOf({}))).toEqual([])
    expect(extractDraggedIds(dragOf({ selectedItems: 'not json' }))).toEqual([])
    expect(extractDraggedIds({ dataTransfer: null })).toEqual([])
  })
})

describe('extractDroppedSvgFiles', () => {
  it('takes SVGs by type or by name', () => {
    const typed = new File(['<svg/>'], 'a', { type: 'image/svg+xml' })
    const named = new File(['<svg/>'], 'B.SVG', { type: '' })
    const png = new File(['x'], 'c.png', { type: 'image/png' })
    expect(extractDroppedSvgFiles(fakeDropEvent([typed, named, png]))).toEqual([
      typed,
      named,
    ])
  })
})
