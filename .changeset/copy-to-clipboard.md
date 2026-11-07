---
'@greese/ui': minor
'@greese/react': minor
---

Copy text from anything. `copyToClipboard(text)` in `@greese/ui` uses the Clipboard API and falls back to a selected textarea where it's missing or refused, rejecting only when both fail. `useCopyToClipboard()` in `@greese/react` copies and holds the outcome (`status`, `copied`) for a moment, and `CopyToClipboard` puts it on any element: its one child copies on click, gets `data-copy-status`, and the outcome is announced. A function child gets the state, to show a check once copied.
