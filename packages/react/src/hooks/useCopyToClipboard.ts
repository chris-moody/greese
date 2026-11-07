'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { copyToClipboard } from '@greese/ui'

/** Where a copy is: nothing yet (or it's been a while), done, or refused. */
export type CopyStatus = 'idle' | 'copied' | 'failed'

export interface UseCopyToClipboardOptions {
  /** Milliseconds the status stays `copied` or `failed` before going back to `idle`. @default 2000 */
  resetAfter?: number
  /** Called with the text once it's on the clipboard. */
  onCopy?: (text: string) => void
  /** Called with the browser's error when it refused the copy. */
  onCopyError?: (error: unknown) => void
}

/** What `useCopyToClipboard` returns. */
export interface CopyToClipboardState {
  /** Copies the text; resolves to whether it worked (it never rejects). */
  copy: (text: string) => Promise<boolean>
  /** The last copy's outcome, until `resetAfter` passes. */
  status: CopyStatus
  /** Shorthand for `status === 'copied'`. */
  copied: boolean
  /** Goes back to `idle` now. */
  reset: () => void
}

/**
 * Copies text and remembers how it went for a moment, to show a check or an
 * error. Built on `copyToClipboard()` from @greese/ui, which code outside
 * React can use; `CopyToClipboard` puts it on any element.
 *
 * ```tsx
 * const { copy, copied } = useCopyToClipboard()
 * <Button onClick={() => copy(url)}>{copied ? 'Copied' : 'Copy link'}</Button>
 * ```
 */
export const useCopyToClipboard = ({
  resetAfter = 2000,
  onCopy,
  onCopyError,
}: UseCopyToClipboardOptions = {}): CopyToClipboardState => {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // The latest callbacks, so `copy` stays the same function across renders.
  const callbacks = useRef({ onCopy, onCopyError })
  useEffect(() => {
    callbacks.current = { onCopy, onCopyError }
  })
  useEffect(() => () => clearTimeout(timer.current), [])

  const reset = useCallback(() => {
    clearTimeout(timer.current)
    setStatus('idle')
  }, [])

  const copy = useCallback(
    async (text: string) => {
      let next: CopyStatus = 'copied'
      try {
        await copyToClipboard(text)
        callbacks.current.onCopy?.(text)
      } catch (error) {
        next = 'failed'
        callbacks.current.onCopyError?.(error)
      }
      clearTimeout(timer.current)
      setStatus(next)
      timer.current = setTimeout(() => setStatus('idle'), resetAfter)
      return next === 'copied'
    },
    [resetAfter]
  )

  return { copy, status, copied: status === 'copied', reset }
}
