---
'@greese/react': patch
---

**`Collapsible` is a Server Component.** It no longer carries `'use client'`: it only listens for its toggle when you pass `onOpenChange`, so without one it's plain `<details>`, shipping no JavaScript.
