/**
 * Copying text, safely. The async Clipboard API is missing on insecure
 * origins and in some WebViews, and a browser can refuse it (permissions, a
 * page without focus), so a copy falls back to selecting a hidden textarea
 * and `document.execCommand('copy')`. Only when both fail does it reject.
 *
 * Framework-free; `useCopyToClipboard()` and `CopyToClipboard` in
 * @greese/react are the React side.
 */

/**
 * The old way: copy the selection of a textarea that's on the page for one
 * moment. Puts focus and the reader's selection back afterwards.
 */
const copyBySelection = (text: string): boolean => {
  if (typeof document == 'undefined') return false
  const focused = document.activeElement as HTMLElement | null
  const selection = document.getSelection()
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i))
    : []
  const area = document.createElement('textarea')
  area.value = text
  // Read-only so phones don't open a keyboard; fixed and transparent so the
  // page neither scrolls to it nor shows it.
  area.readOnly = true
  area.style.cssText = 'position:fixed;inset:0;opacity:0;pointer-events:none'
  document.body.append(area)
  area.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    // Refused: report it below.
  }
  area.remove()
  focused?.focus({ preventScroll: true })
  if (selection && ranges.length) {
    selection.removeAllRanges()
    for (const range of ranges) selection.addRange(range)
  }
  return copied
}

/**
 * Copies `text` to the clipboard. Resolves once it's there; rejects when the
 * browser allows neither the Clipboard API nor the fallback.
 *
 * ```ts
 * await copyToClipboard("import { CopyIcon } from '@greese/icons'")
 * ```
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    if (!copyBySelection(text)) throw error
  }
}
