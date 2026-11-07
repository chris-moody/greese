'use client'
import type { JSX, MouseEvent, ReactElement } from 'react'
import {
  useCopyToClipboard,
  type CopyToClipboardState,
  type UseCopyToClipboardOptions,
} from '../../hooks/useCopyToClipboard.ts'
import { Slot } from '../Slot/Slot.tsx'
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.tsx'

export interface CopyToClipboardProps extends UseCopyToClipboardOptions {
  /** What a click copies: the text, or a function that returns it at the moment of the click. */
  text: string | (() => string)
  /**
   * One element, which copies on click: a Button, an IconButton, a link,
   * anything that takes `onClick`. Or a function of the copy's state that
   * returns one, to show a check once it's copied.
   */
  children: ReactElement | ((state: CopyToClipboardState) => ReactElement)
  /** Read out once the text is copied. @default 'Copied' */
  copiedMessage?: string
  /** Read out when the browser refused. @default "Couldn't copy" */
  failedMessage?: string
  /** Whether it announces the outcome, from a visually hidden live region. Turn it off when the page announces copies itself. @default true */
  announce?: boolean
}

/**
 * Makes any element copy text on click. Its child gets the click handler and
 * `data-copy-status` (`copied`, `failed`), for styling, and the outcome is
 * announced. A child that isn't a control (a `<code>`, a card) should be
 * made focusable and keyboard-operable, or wrap a button instead.
 *
 * ```tsx
 * <CopyToClipboard text={command}>
 *   {({ copied }) => (
 *     <IconButton label="Copy the command">{copied ? <CheckIcon /> : <CopyIcon />}</IconButton>
 *   )}
 * </CopyToClipboard>
 * ```
 */
export const CopyToClipboard = ({
  text,
  children,
  copiedMessage = 'Copied',
  failedMessage = "Couldn't copy",
  announce = true,
  ...options
}: CopyToClipboardProps): JSX.Element => {
  const state = useCopyToClipboard(options)
  const { copy, status } = state
  return (
    <>
      <Slot
        data-copy-status={status === 'idle' ? undefined : status}
        // Runs after the child's own onClick, which can cancel the copy.
        onClick={(event: MouseEvent<HTMLElement>) => {
          if (!event.defaultPrevented)
            void copy(typeof text === 'function' ? text() : text)
        }}
      >
        {typeof children === 'function' ? children(state) : children}
      </Slot>
      {announce && (
        <VisuallyHidden role="status">
          {status === 'copied' ? copiedMessage : status === 'failed' ? failedMessage : ''}
        </VisuallyHidden>
      )}
    </>
  )
}
