---
'@greese/js': patch
---

**greese.js doesn't rewrite a style or attribute that's already at its value.** A target holding still mid-timeline (between staggers, in a hold, a repeat's rest) cost a style change and a DOM mutation every frame; now it costs nothing, which also keeps devtools' Elements panel responsive while a loop runs.
