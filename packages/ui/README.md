# @greese/ui

GreeseUI's CSS and design tokens, with no framework attached. Use it from
plain HTML, or under any framework: `@greese/react` renders the same markup,
and the Svelte, Vue and Angular packages will too (ADR 0014).

```bash
npm install @greese/ui
```

```html
<link rel="stylesheet" href="node_modules/@greese/ui/dist/greese.css" />
<!-- or, with a bundler: import '@greese/ui/styles.css' -->

<button class="greese-Button greese-Button--solid">Save changes</button>
```

Each component's classes, parts, modifiers and state attributes are listed in
the docs' Styling sections (and in `style-manifest.json`), and they're a
public contract: every framework package renders the same ones. Native
elements need nothing else (`<dialog>`, `<details>`, form controls);
widgets with keyboard behaviour (Tabs, Combobox…) also need JavaScript, which
the framework packages provide.

## What's in it

| Import                           | What                                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@greese/ui/styles.css`          | Tokens and every component's styles                                                                                                                             |
| `@greese/ui/base.css`            | Opt-in reset and page defaults                                                                                                                                  |
| `@greese/ui/css/<Name>.css`      | One component's own styles (plus the shared core). A component built on others (a Dialog uses Button) needs theirs too; the framework packages wire that up     |
| `@greese/ui/tokens.css`          | `--greese-*` custom properties, in `@layer greese.tokens`                                                                                                       |
| `@greese/ui/palette.css`         | Opt-in: the palette as `--greese-<hue>-<shade>` (`--greese-lavender-600`), about 1.5 kB compressed                                                              |
| `@greese/ui/scss`                | The whole stylesheet as Sass, configurable (`@use 'pkg:@greese/ui/scss' with ($breakpoints: …)`)                                                                |
| `@greese/ui/scss/kit`            | The theming kit: `@use 'pkg:@greese/ui/scss/kit' as greese`, build-time themes that reject unknown names                                                        |
| `@greese/ui/scss/tokens`         | The token CSS, plus `$breakpoints` and `$space-keys` Sass maps                                                                                                  |
| `@greese/ui/scss/layers`         | Only the cascade layer order statement                                                                                                                          |
| `@greese/ui/scss/maps`           | Only the Sass maps (`$breakpoints`, `$space-keys`, every token default as `$color` and `$scalars`, the palette as `$palette`, and `$layer-order`); emits no CSS |
| `@greese/ui/style-manifest.json` | Every component's styling API, read from the compiled CSS                                                                                                       |
| `@greese/ui`                     | TypeScript constants (`color`, `palette` and each hue, `space`, `radius`, `lineHeight`, `shadow`, `breakpoints`, …), `createTheme()` and `getSchemeScript()`    |

It has no dependencies.

Colors follow the OS color scheme. `data-greese-scheme="light"` or `"dark"` on
any element forces a mode for that subtree, and modes can be nested. `createTheme()` builds a scoped theme as a static CSS string, which you can serve however you like and apply with `data-greese-theme="<name>"`.

## Color roles and the palette

`color` holds the semantic roles components use. The brand colors, in order,
are `primary` (what components use for interactive emphasis), `secondary`,
`tertiary` and `accent`, each with `…Strong` and a WCAG-safe `…Content`
color that `createTheme` derives when you set only the main color.

`palette` is 22 hues × 11 shades (`50`–`999`). Use it instead of hex literals: `palette.lavender[600]` or
`import { lavender } from '@greese/ui'` in TypeScript, `lavender-600` in
the SCSS kit, `var(--greese-lavender-600)` with `palette.css`.
