/**
 * The args a story is shown with, by story id: its own, until a control
 * changes them. Shared, so a page's controls and every canvas of that story
 * (an MDX page's `<Controls of>` beside its `<Canvas of>`) stay in step.
 */
import { useCallback, useSyncExternalStore } from 'react'
import type { Args, ComposedStory } from './load.ts'

const changed = new Map<string, Args>()
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const emit = () => listeners.forEach((listener) => listener())

export interface StoryArgs {
  args: Args
  /** Sets one arg; `undefined` removes it. */
  set: (name: string, value: unknown) => void
  /** Back to the story's own args. */
  reset: () => void
  /** Whether a control has changed them. */
  edited: boolean
}

export const useStoryArgs = (story: ComposedStory): StoryArgs => {
  const own = useSyncExternalStore(subscribe, () => changed.get(story.id))
  const set = useCallback(
    (name: string, value: unknown) => {
      const next = { ...(changed.get(story.id) ?? story.args) }
      if (value === undefined) delete next[name]
      else next[name] = value
      changed.set(story.id, next)
      emit()
    },
    [story]
  )
  const reset = useCallback(() => {
    changed.delete(story.id)
    emit()
  }, [story])
  return { args: own ?? story.args, set, reset, edited: own !== undefined }
}
