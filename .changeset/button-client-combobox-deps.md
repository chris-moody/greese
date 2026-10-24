---
'@greese/react': patch
---

- **`Button` is a client component:** it always handles clicks (to block them while loading or disabled), so it now carries `'use client'` and no longer throws when a Server Component renders it, or `IconButton`, `Alert` and the rest built on it.
- **`Combobox`** looks option ids up once per options list instead of once per option (long lists rendered in quadratic time), and keeps its text in step with the selected option's label rather than re-running on every render.
- **`ScrollCarousel`** starts at `defaultIndex` once, with complete hook dependencies.
