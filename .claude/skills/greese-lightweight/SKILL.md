---
name: greese-lightweight
description: Keeping GreeseUI and greese.js small - dependency policy, size budgets, how to measure JS/CSS cost per component and module, and tactics for cutting bytes. Use when adding dependencies or features, when size-limit fails, when reviewing a change for weight, or when asked to make something lighter or faster.
---

# Keeping GreeseUI light

Being lightweight is a product requirement, not a nicety. ADR 0006 sets the
budgets and ADR 0008 covers greese.js.

## Dependency policy

- **Runtime dependencies:**
  - `@greese/react` depends only on `@greese/ui` and
    `@greese/js`, with React as a peer;
  - `@greese/js` and `@greese/ui` depend on nothing.
- **Adding a runtime dependency** needs an ADR, and is almost always no.
  Prefer, in order:
  1. a platform feature (`<dialog>`, the Popover API, anchor positioning,
     `@starting-style`, `color-mix`, individual transforms, container
     queries);
  2. CSS;
  3. a few lines of our own code.
- Dev dependencies are fine when they earn their place.

## Budgets (brotli)

| What                                                    | Budget                   | Where                            |
| ------------------------------------------------------- | ------------------------ | -------------------------------- |
| All components (greese.js excluded)                     | 22 kB                    | `packages/react/.size-limit.cjs` |
| All components + greese.js                              | 26 kB                    | same                             |
| Each listed component, tree-shaken                      | 0.3–4.75 kB              | same                             |
| `greese` prop runtime (lazy chunk)                      | 7 kB                     | same                             |
| `greese.css` (`@greese/ui`)                             | 20 kB                    | `packages/ui/.size-limit.cjs`    |
| `base.css` (`@greese/ui`)                               | 1 kB                     | same                             |
| greese.js: everything / `animate` / `ease` / `<script>` | 6.5 / 5.5 / 1 / 6.85 kB | `packages/js/.size-limit.json`   |

Every component entry includes the `greese` prop's shared static part (about
0.75 kB: resolver + island). The runtime is a lazy chunk, behind a dynamic
`import()`. size-limit doesn't split chunks, so component entries keep it
external (`modifyRolldownConfig: external`) and it's measured on its own.
Keep it lazy: a static import of `greeseRuntime.ts` or greese.js from any
component would add about 6 kB to every app (`verify:packages` checks this
in a real Vite build).

New interactive components get their own entry, set about 10% above the
measured size. **Raising a budget** is a decision: say why in the commit, and
for anything over ~1 kB, in an ADR.

## Measuring

```bash
npm run build -w @greese/react && npm run size -w @greese/react
npm run build -w @greese/js && npm run size -w @greese/js

# Per module, to find what is heavy (minified, then brotli):
for f in packages/js/dist/*.js; do
  printf "%-40s %s\n" "$f" "$(npx esbuild "$f" --minify --format=esm --log-level=error | brotli -c | wc -c)"
done

# Per component CSS:
for f in packages/react/dist/css/*.css; do printf "%-50s %s\n" "$f" "$(brotli -c "$f" | wc -c)"; done | sort -k2 -n
```

`verify:packages` proves tree-shaking works: the Dialog + Button bundle
contains Button's CSS once and nothing unrelated. Keep it passing.

## Tactics that work here

- **Zero-runtime first:** a class or a custom property instead of JS state.
  A CSS solution costs nothing per render and nothing in the JS budget.
- **Composition over new components:** a story recipe costs zero bytes.
- **Share, don't copy:** use the existing utilities (`cx`, `resolveResponsive`,
  `useControllableState`, `useFieldControl`, `composeRefs`, `Slot`,
  `utils/anchor.ts`) and mixins.
- **No barrels inside components.** Import concrete files (`../Button/Button.tsx`)
  so the CSS dependency graph and tree-shaking stay precise.
- **Lazy heavy paths:**
  - code needed only on interaction (a positioning fallback, a drag) lives
    behind the event, not in render;
  - components must never statically import greese.js. Animation for the
    `greese` prop is CSS presets plus a lazily loaded runtime (see
    ADR 0009).
- **Cut what doesn't earn its bytes:**
  - in ports, drop rarely used modes (ColorPicker dropped LAB/CMYK);
  - prefer one good default to many options.
- **Names that don't minify:** class methods and properties keep their names
  after minification. Keep public API names short and clear, and don't
  obsess. Converting privates to `#private` saved only ~60 B in greese.js.
- **Performance at runtime:**
  - no layout reads in render;
  - one style write per property per frame;
  - observers over listeners;
  - `content-visibility` and lazy media where relevant;
  - Lighthouse budgets (performance ≥ 0.95, TBT < 100 ms, CLS < 0.05) apply
    to every playground page.

## When size-limit fails

1. Rebuild first (`npm run build`). Stale `dist/` lies.
2. Find the cause with the per-module and per-component measurements above,
   and `git stash` to compare before and after.
3. Cut, or justify. If the growth is the feature itself (five new components
   raised the whole-library budget from 18 to 20 kB), raise the budget in the
   same commit and say so.
