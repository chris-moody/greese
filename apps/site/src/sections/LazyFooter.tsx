import { fromChunk, loadFooter } from '../pages/chunks.ts'

/**
 * The footer, a chunk of its own: on every page, at the end of the page's
 * main column (the docs and the studio put it beside their sidebars); the
 * homepage brings its own after its sections. A page change fetches it
 * before the next page commits (pages/chunks.ts).
 */
export const Footer = fromChunk(loadFooter, (m) => m.Footer)
