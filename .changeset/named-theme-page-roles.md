---
'@greese/ui': patch
---

A named theme's page roles (`motion-defaults()` inside `theme(name)`) also go on the root while the theme is on the page (`:root:has([data-greese-theme='<name>'])`), so a theme scoped to an element, with `ThemeProvider` say, reaches the view transition snapshots, which inherit from the root.
