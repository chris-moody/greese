export interface SplitTextOptions {
  /** @default 'chars' */
  by?: 'chars' | 'words'
}

export interface SplitText {
  /** One element per character or word, in reading order: animate these. */
  elements: HTMLElement[]
  /** Puts the original content back. */
  revert(): void
}

const VISUALLY_HIDDEN =
  'position:absolute;inline-size:1px;block-size:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap'

/**
 * Wraps an element's text in one inline-block span per character or word,
 * for staggered text animation:
 *
 * ```ts
 * const { elements } = splitText(heading)
 * animate(elements, { opacity: [0, 1], y: [8, 0] }, { stagger: 0.02 })
 * ```
 *
 * The pieces are hidden from assistive technology and the whole text is kept
 * once, visually hidden, so screen readers read words, not letters.
 * Characters stay grouped per word, so lines still wrap between words. Use it
 * on plain text: links and other markup inside are flattened.
 */
export const splitText = (
  el: HTMLElement,
  { by = 'chars' }: SplitTextOptions = {}
): SplitText => {
  const original = [...el.childNodes]
  const text = el.textContent ?? ''
  const elements: HTMLElement[] = []
  const piece = (content: string) => {
    const span = document.createElement('span')
    span.style.display = 'inline-block'
    span.textContent = content
    return span
  }

  const visual = document.createElement('span')
  visual.setAttribute('aria-hidden', 'true')
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue
    if (/^\s+$/.test(part)) {
      visual.append(part)
      continue
    }
    if (by === 'words') {
      elements.push(visual.appendChild(piece(part)))
      continue
    }
    const word = piece('')
    word.style.whiteSpace = 'nowrap'
    // Array.from splits by code point, so emoji and accents stay whole.
    for (const char of Array.from(part)) elements.push(word.appendChild(piece(char)))
    visual.append(word)
  }

  const accessible = document.createElement('span')
  accessible.style.cssText = VISUALLY_HIDDEN
  accessible.textContent = text
  el.replaceChildren(accessible, visual)

  return {
    elements,
    revert: () => el.replaceChildren(...original),
  }
}
