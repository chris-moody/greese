---
'@greese/ui': patch
---

**`createStoredValue` (and `useStoredState`) hears only its own storage area from other tabs:** a `sessionStorage` write no longer wakes a `localStorage` value with the same key, and the other way round.
