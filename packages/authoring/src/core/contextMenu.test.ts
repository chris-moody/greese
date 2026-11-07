import { describe, expect, it, vi } from 'vitest'
import { contextMenuPoint } from './contextMenu.ts'

const event = (clientX: number, clientY: number) => {
  const target = document.createElement('button')
  target.getBoundingClientRect = () => ({ left: 10, bottom: 40 }) as DOMRect
  return { clientX, clientY, currentTarget: target, preventDefault: vi.fn() }
}

describe('contextMenuPoint', () => {
  it('cancels the browser menu and opens at the pointer', () => {
    const e = event(120, 80)
    expect(contextMenuPoint(e)).toEqual({ top: 80, left: 120 })
    expect(e.preventDefault).toHaveBeenCalled()
  })

  it('opens at the trigger’s corner when the keyboard asked', () => {
    expect(contextMenuPoint(event(0, 0))).toEqual({ top: 40, left: 10 })
  })
})
