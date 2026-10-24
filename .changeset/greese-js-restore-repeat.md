---
'@greese/js': patch
---

- **`kill()` puts elements back as they were:** it removes the inline styles and attributes a timeline added, and restores ones that were already there, instead of writing each property's computed value inline, where it overrode the element's own CSS (a `:hover` rule, a class added later).
- **Callbacks fire once per play-through:** with `repeat`, a callback added with `call()` fired again whenever a repeat started over. With `yoyo` it still fires on the way there and on the way back.
- **`invalidate()` re-reads transforms** set on the element since, instead of composing stale ones.
- **`seek()` to a label that doesn't exist throws**, instead of quietly adding it at the end. Positions in `to()`, `add()` and the rest still create a label they name.
