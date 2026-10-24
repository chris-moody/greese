---
'@greese/ui': minor
'@greese/react': minor
---

Add `createStoredValue()` (@greese/ui) and `useStoredState()` (@greese/react). They keep a value in localStorage or sessionStorage safely: in memory where storage is missing, blocked or full; parsed, with optional validation; shared by every reader of the key, in this tab and across tabs. `useColorScheme` now saves through it.
