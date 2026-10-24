---
'@greese/react': patch
---

**`TextField` and `DateField` render in Server Components.** They only compose client components (Field, Input) and use no hooks themselves, so they no longer carry `'use client'`.
