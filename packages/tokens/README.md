# @greese-ui/tokens

GreeseUI's design tokens, in three forms:

| Import                           | What                                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@greese-ui/tokens/tokens.css`   | `--greese-*` custom properties, in `@layer greese.tokens`                                                                                                       |
| `@greese-ui/tokens/palette.css`  | Opt-in: the palette as `--greese-<hue>-<shade>` (`--greese-lavender-600`), about 2 kB compressed                                                                  |
| `@greese-ui/tokens/scss`         | The same CSS, plus `$breakpoints` and `$space-keys` Sass maps                                                                                                   |
| `@greese-ui/tokens/scss/layers`  | Only the cascade layer order statement                                                                                                                          |
| `@greese-ui/tokens/scss/maps`    | Only the Sass maps (`$breakpoints`, `$space-keys`, every token default as `$color` and `$scalars`, the palette as `$palette`, and `$layer-order`); emits no CSS |
| `@greese-ui/tokens`              | TypeScript constants (`color`, `palette` and each hue, `space`, `radius`, `fontSize`, `shadow`, `breakpoints`, …), `createTheme()` and `getSchemeScript()`      |

You only need this package directly if you use the tokens without
`@greese-ui/react`, whose stylesheet already includes them.

Colours follow the OS colour scheme. `data-greese-scheme="light"` or `"dark"` on
any element forces a mode for that subtree, and modes can be nested. `createTheme()` builds a scoped theme as a static CSS string, which you can serve however you like and apply with `data-greese-theme="<name>"`.

## Colour roles and the palette

`color` holds the semantic roles components use. The brand colours, in order,
are `primary` (what components use for interactive emphasis), `secondary`,
`tertiary` and `accent`, each with `…Strong` and a WCAG-safe `…Content`
colour that `createTheme` derives when you set only the main colour.

`palette` is 22 hues × 11 shades (`50`–`999`), like
MUI's `colors`. Use it instead of hex literals: `palette.lavender[600]` or
`import { lavender } from '@greese-ui/tokens'` in TypeScript, `lavender-600` in
the SCSS kit, `var(--greese-lavender-600)` with `palette.css`.
