---
'@greese/ui': patch
---

A theme now applies its `font.body` to its own scope. `body` reads `--greese-font-body` from `:root`, so a theme on a `ThemeProvider` wrapper set the variable but text kept inheriting the default font from `<body>`.
