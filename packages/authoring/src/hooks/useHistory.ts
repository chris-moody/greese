'use client'
import { useCallback, useEffect } from 'react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../environment/environment.tsx'
import { redo, undo } from '../state/commandsMiddleware.ts'
import { isEditableTarget } from '../core/tools/tools.ts'

export interface HistoryControls {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

/** Reactive undo/redo state + actions for the current environment. */
export const useHistory = (): HistoryControls => {
  const dispatch = useAuthoringDispatch()
  const canUndo = useAuthoringSelector((state) => state.history.canUndo)
  const canRedo = useAuthoringSelector((state) => state.history.canRedo)

  return {
    canUndo,
    canRedo,
    undo: useCallback(() => dispatch(undo()), [dispatch]),
    redo: useCallback(() => dispatch(redo()), [dispatch]),
  }
}

export interface UseUndoRedoKeymapOptions {
  /** Where key presses are heard: an editor's root, so the page keeps its own. @default window */
  target?: EventTarget | null
}

/**
 * ⌘/Ctrl+Z (undo) and ⌘/Ctrl+Shift+Z or ⌘/Ctrl+Y (redo). A text field keeps
 * its own undo, and a key something else handled is left alone.
 */
export const useUndoRedoKeymap = ({ target }: UseUndoRedoKeymapOptions = {}): void => {
  const dispatch = useAuthoringDispatch()

  useEffect(() => {
    const source = target === undefined ? window : target
    if (!source) return
    const onKeyDown = (event: Event) => {
      const key = event as KeyboardEvent
      if (key.defaultPrevented || !(key.metaKey || key.ctrlKey)) return
      if (isEditableTarget(key.target)) return
      const name = key.key.toLowerCase()
      if (name === 'z') {
        key.preventDefault()
        dispatch(key.shiftKey ? redo() : undo())
      } else if (name === 'y') {
        key.preventDefault()
        dispatch(redo())
      }
    }
    source.addEventListener('keydown', onKeyDown)
    return () => source.removeEventListener('keydown', onKeyDown)
  }, [dispatch, target])
}
