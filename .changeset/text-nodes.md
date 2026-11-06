---
'@greese/js': minor
'@greese/react': minor
---

Animate the text nodes of the elements you target, keeping their markup.

- greese.js's `text` writes into an element's text nodes in reading order, each up to its own length, so typing into `Read <a>the docs</a>` keeps the link and reveals it as it goes. An element with no text nodes still gets `textContent`.
- `splitText` splits each text node where it is: links, emphasis and code stay the same elements, with their pieces inside, still focusable and clickable. Each text node's text is kept once, visually hidden, for screen readers. `revert()` puts the original nodes back.
- The `greese` prop's `text: 'type'` and `text: 'split'` now work on content with markup; `type` plays on an inert, aria-hidden copy. `text: 'count'` still takes a plain number.
