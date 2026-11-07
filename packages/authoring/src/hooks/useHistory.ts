import { useCallback, useEffect } from 'react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../environment/environment.tsx'
import { redo, undo } from '../state/commandsMiddleware.ts'

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

/** Global ⌘/Ctrl+Z (undo) and ⌘/Ctrl+Shift+Z or ⌘/Ctrl+Y (redo) shortcuts. */
export const useUndoRedoKeymap = (): void => {
  const dispatch = useAuthoringDispatch()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        dispatch(event.shiftKey ? redo() : undo())
      } else if (key === 'y') {
        event.preventDefault()
        dispatch(redo())
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch])
}
