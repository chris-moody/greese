import { textNodes } from './target.ts'

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
 * Each of the element's text nodes is split where it is, so markup inside
 * stays: a link is still a link, an `<em>` still emphasis, and its pieces
 * animate with the rest. The pieces are hidden from assistive technology and
 * each text node's text is kept once beside them, visually hidden, so screen
 * readers read words, not letters. Characters stay grouped per word, so lines
 * still wrap between words.
 */
export const splitText = (
  el: HTMLElement,
  { by = 'chars' }: SplitTextOptions = {}
): SplitText => {
  const elements: HTMLElement[] = []
  const swapped: [Text, HTMLElement, HTMLElement][] = []
  const piece = (content: string) => {
    const span = document.createElement('span')
    // A link's underline doesn't reach into inline blocks: each piece takes
    // its parent's own, through the wrappers, so a split link is underlined.
    span.style.cssText = 'display:inline-block;text-decoration:inherit'
    span.textContent = content
    return span
  }

  for (const node of textNodes(el)) {
    // Whitespace between elements is left as it is: nothing to animate.
    if (!node.data.trim()) continue
    const visual = document.createElement('span')
    visual.setAttribute('aria-hidden', 'true')
    visual.style.textDecoration = 'inherit'
    for (const part of node.data.split(/(\s+)/)) {
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
    accessible.textContent = node.data
    node.replaceWith(accessible, visual)
    swapped.push([node, accessible, visual])
  }

  return {
    elements,
    revert: () => {
      for (const [node, accessible, visual] of swapped) {
        accessible.replaceWith(node)
        visual.remove()
      }
    },
  }
}
