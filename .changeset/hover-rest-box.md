---
'@greese/react': patch
---

**`greese` hovers that move the element end cleanly.** Entering again while the element is still settling back keeps the box it rests in (it measured where it had moved to, so the lift could bounce again), a page scroll no longer shifts that box, and the hover ends when the pointer leaves the window or the page loses focus, instead of staying lifted.
