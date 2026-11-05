---
'@greese/react': minor
'@greese/ui': minor
---

- **`Chip` takes a `size`**: `xs` through `xl`, setting the height, the inline
  padding and the text size together, and scaling the remove button with them
  so a small chip still fits one.

  ```tsx
  <Chip size="sm" tone="secondary">Featured</Chip>
  ```

  A chip's scale is its own, not the shared control scale: a chip is a label
  rather than something you type in, so it runs smaller than an input of the
  same name and needs no 44px floor (its toggle and remove buttons keep
  theirs). `md` is the size every chip already was, so nothing moves.

  The four values arrive as per-instance variables —
  `--greese-chip-height`, `--greese-chip-padding`, `--greese-chip-font` and
  `--greese-chip-remove` — so one of them can be overridden on a chip, or
  across an area, without picking a different size.

  Every chip now carries a `greese-Chip--size-*` class. A test asserting that a
  plain chip had no modifier class at all needs to say "only its size" instead.
