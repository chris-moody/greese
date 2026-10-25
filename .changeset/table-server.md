---
'@greese/react': minor
---

**`Table` and all its parts are Server Components:** a data table ships no JavaScript and hydrates about 25% faster. **Changed:** every `Table` now carries explicit `table`, `rowgroup`, `row`, `columnheader` and `cell` roles, not only stacked ones; they're redundant on a plain table and change nothing for assistive tech.
