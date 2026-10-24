---
'@greese/ui': patch
---

**A disabled link styled as a button can't be clicked without script:** `.greese-Button` that isn't a `<button>` lets the pointer pass through while `aria-disabled="true"`, as Button's server-safe press blocking needs.
