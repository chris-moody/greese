# @sauce-ui/tokens

SauceUI's design tokens, in three forms:

| Import | What |
|---|---|
| `@sauce-ui/tokens/tokens.css` | `--sauce-*` custom properties, in `@layer sauce.tokens` |
| `@sauce-ui/tokens/scss` | The same CSS, plus `$breakpoints` and `$space-keys` Sass maps |
| `@sauce-ui/tokens/scss/layers` | Only the cascade layer order statement |
| `@sauce-ui/tokens` | TypeScript constants (`color`, `space`, `radius`, `fontSize`, `shadow`, `breakpoints`, …), `createTheme()` and `getSchemeScript()` |

You only need this package directly if you use the tokens without
`@sauce-ui/react`, whose stylesheet already includes them.

Colours follow the OS colour scheme. `data-sauce-scheme="light"` or `"dark"` on
any element forces a mode for that subtree, and modes can be nested. `createTheme()` builds a scoped theme as a static CSS string, which you can serve however you like and apply with `data-sauce-theme="<name>"`.
