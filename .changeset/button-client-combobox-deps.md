---
'@greese/react': patch
---

- **`Button` renders in Server Components.** It used to wrap every click in a handler of its own, to ignore presses while loading or disabled, which a Server Component can't hand the browser, so `Button`, `IconButton`, `Alert` and the rest built on it threw there. It now blocks those presses without script: a loading button is `type="button"` (it can't submit or reset its form), a disabled `asChild` link leaves the tab order and the pointer, and only an `onClick` you pass (which only a client component can) is wrapped.
- **`Combobox`** looks option ids up once per options list instead of once per option (long lists rendered in quadratic time), and keeps its text in step with the selected option's label rather than re-running on every render.
- **`ScrollCarousel`** starts at `defaultIndex` once, with complete hook dependencies.
