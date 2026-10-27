import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import type { ColorScheme } from '@greese/react'
import { useStable } from '../useStable.ts'
import type { FromPreview, Picked, RenderedColors, ToPreview } from './protocol.ts'
import { customBreakpoints, type ThemeSpec } from './spec.ts'
import type { Compiled } from './useCompile.ts'

interface PreviewSync {
  frame: RefObject<HTMLIFrameElement | null>
  spec: ThemeSpec
  compiled: Compiled
  scheme: ColorScheme
  inspect: boolean
  /** The component the Components tab is on: the preview features it. */
  component: string
  /** Inspect highlights the component only on its tab. */
  highlight: boolean
  /** Bumped by "Replay motion". */
  replay: number
  onReplay: () => void
  onColors: (colors: RenderedColors | undefined) => void
  /** A component picked in the preview with Inspect on. */
  onPick: (pick: Picked) => void
  /** The preview's content height, in px. */
  onSize: (height: number) => void
}

/**
 * Keeps the preview (an iframe, so the theme never restyles the editor) in
 * step with the studio: its CSS, scope, effects, inspect state and featured
 * component, sent as they change and all again when it (re)loads; and hears
 * back the colors it renders, the component Inspect picks and its height.
 */
export const usePreviewSync = ({
  frame,
  spec,
  compiled,
  scheme,
  inspect,
  component,
  highlight,
  replay,
  onReplay,
  onColors,
  onPick,
  onSize,
}: PreviewSync): void => {
  const post = useCallback(
    (message: ToPreview) =>
      frame.current?.contentWindow?.postMessage(message, location.origin),
    [frame]
  )
  const effects = useStable(spec.effects)
  const custom = useStable(customBreakpoints(spec))
  const css = useMemo<ToPreview>(
    () => ({
      type: 'css',
      css: compiled.css,
      full: compiled.full,
      breakpoints: compiled.full && custom ? Object.fromEntries(custom) : undefined,
    }),
    [compiled.css, compiled.full, custom]
  )
  const scope = useMemo<ToPreview>(
    () => ({ type: 'scope', theme: spec.name || undefined, scheme }),
    [spec.name, scheme]
  )
  useEffect(() => post(css), [css, post])
  useEffect(() => post(scope), [scope, post])
  useEffect(() => post({ type: 'inspect', on: inspect }), [inspect, post])
  useEffect(() => post({ type: 'effects', effects }), [effects, post])
  useEffect(() => post({ type: 'feature', block: component }), [component, post])
  useEffect(
    () => post({ type: 'highlight', block: highlight ? component : undefined }),
    [highlight, component, post]
  )

  // "Replay motion" in the header remounts the preview's gallery.
  const replayed = useRef(replay)
  useEffect(() => {
    if (replay !== replayed.current) {
      post({ type: 'replay' })
      onReplay()
    }
    replayed.current = replay
  }, [replay, post, onReplay])

  // The latest callbacks, so the listener isn't re-added for each new function.
  const handlers = useRef({ onColors, onPick, onSize })
  useEffect(() => {
    handlers.current = { onColors, onPick, onSize }
  })
  useEffect(() => {
    const onMessage = (event: MessageEvent<FromPreview>) => {
      if (event.origin !== location.origin) return
      if (event.data.type === 'ready') {
        post(css)
        post(scope)
        post({ type: 'effects', effects })
        post({ type: 'inspect', on: inspect })
        post({ type: 'feature', block: component })
      }
      if (event.data.type === 'colors') {
        const { type: _type, ...colors } = event.data
        handlers.current.onColors(colors)
      }
      if (event.data.type === 'pick') {
        const { type: _type, ...pick } = event.data
        handlers.current.onPick(pick)
      }
      if (event.data.type === 'size') handlers.current.onSize(event.data.height)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [css, scope, effects, inspect, component, post])
}
