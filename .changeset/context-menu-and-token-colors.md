---
'@greese/react': minor
'@greese/ui': minor
---

- **`ContextMenu`**: a menu opened at the pointer, or hung off an element as a
  submenu. `Menu` is a menu _button_ — it owns a trigger and its own open
  state, and has nowhere to put a right-click — so this takes the other shape:
  the caller decides when and where it opens, and `anchor` carries both.

  ```tsx
  const [at, setAt] = useState<ContextMenuPoint | null>(null)

  <div onContextMenu={(e) => { e.preventDefault(); setAt({ top: e.clientY, left: e.clientX }) }}>…</div>
  <ContextMenu anchor={at} onClose={() => setAt(null)}>
    <MenuItem onSelect={rename}>Rename</MenuItem>
    <MenuSeparator />
    <MenuItem tone="negative" onSelect={remove}>Delete</MenuItem>
  </ContextMenu>
  ```

  Pass coordinates for a menu at the pointer, an element for a submenu, or
  `null` to close it — one prop, because where it opens and whether it is open
  are the same question. Point anchoring works by putting a zero-size element
  at the coordinates and anchoring to that, so there is no second positioning
  path: it is the same CSS anchor positioning, flip-to-fit included, that every
  other overlay uses.

  The items are `MenuItem` and `MenuSeparator`, unchanged — they close the menu
  they were chosen in, whichever of the two it is. The keyboard pattern is
  shared with `Menu`: arrows and Home/End move, type-ahead jumps, Tab and
  Escape close. It is a popover, so it draws above any dialog or panel and
  light-dismisses; focus moves to the first item on open and returns to where
  it was on close.

- **`useTokenColors`**: resolved values for color tokens, for the one case that
  cannot use `var()` — drawing to a `<canvas>`.

  ```tsx
  const canvas = useRef<HTMLCanvasElement>(null)
  const [line, grid] = useTokenColors(canvas, 'primary', 'border')
  ```

  Everywhere else, naming the token in CSS is better and this hook is the wrong
  tool: the browser resolves it, nothing reads the palette in JavaScript, and a
  scheme change re-paints without a re-render. SVG counts as CSS — `fill` and
  `stroke` take a `var()` directly. A canvas has no CSS, and its context wants
  a real color string.

  Values are read from a live element, so they are whatever the cascade
  resolved there, a `ThemeProvider scheme` on an ancestor included, and they
  are re-read when the scheme changes. Roles a theme added through `extend`
  work alongside the built-in ones. The result is a tuple in the order given,
  stable while the values are, so it is safe in a dependency list.

- `@greese/ui` gains the `greese-ContextMenu` block: a `greese-Menu` surface
  that sizes to its own items, since it has no trigger whose width to match.
