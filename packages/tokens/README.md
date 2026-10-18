# @greese-ui/tokens

GreeseUI's design tokens, in three forms:

| Import | What |
|---|---|
| `@greese-ui/tokens/tokens.css` | `--greese-*` custom properties, in `@layer greese.tokens` |
| `@greese-ui/tokens/scss` | The same CSS, plus `$breakpoints` and `$space-keys` Sass maps |
| `@greese-ui/tokens/scss/layers` | Only the cascade layer order statement |
| `@greese-ui/tokens/scss/maps` | Only the Sass maps; emits no CSS |
| `@greese-ui/tokens` | TypeScript constants (`color`, `space`, `radius`, `fontSize`, `shadow`, `breakpoints`, …), `createTheme()` and `getSchemeScript()` |

You only need this package directly if you use the tokens without
`@greese-ui/react`, whose stylesheet already includes them.

Colours follow the OS colour scheme. `data-greese-scheme="light"` or `"dark"` on
any element forces a mode for that subtree, and modes can be nested. `createTheme()` builds a scoped theme as a static CSS string, which you can serve however you like and apply with `data-greese-theme="<name>"`.
