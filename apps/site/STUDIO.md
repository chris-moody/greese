# Theme Studio

The `/studio` route of the web app in `apps/site` (ADR 0018), which
also holds the homepage. It's a local web app for building a GreeseUI theme: tokens, component overrides
and theme-wide motion, previewed live on real components and saved to your
project as files.

```sh
npm run studio                                             # a working copy of the example theme (.local/, untracked)
GREESE_THEME=src/styles/greese-theme.json npm run studio   # your own
```

`GREESE_THEME` is resolved from the directory you ran npm in. It opens on
<http://localhost:5180/studio>.

A hosted copy runs at <https://chris-moody.github.io/greese/studio/>. It
compiles in your browser and keeps the theme there: save, then download
`greese-theme.json` (and the SCSS and CSS) from the Code tab, and open the
JSON here to carry on. Importing from project files needs `npm run studio`.

## Files

| File                | Written by          | Use                                                               |
| ------------------- | ------------------- | ----------------------------------------------------------------- |
| `greese-theme.json` | You and the studio  | The theme. Commit it                                              |
| `greese-theme.scss` | The studio, on save | Kit calls (`pkg:@greese/ui/scss/kit`), for apps that compile Sass |
| `greese-theme.css`  | The studio, on save | The same, compiled, for apps that don't                           |

The SCSS and CSS are generated: edit the JSON or use the studio, and keep
hand-written overrides in a stylesheet of your own. If the JSON changes on
disk, the studio reloads it, or asks first when you have unsaved edits.

## Greese tab

The theme's effects. Every built-in effect is listed with the keyframes it
plays, as code; edit it and the theme changes. Below the list, add an effect of
your own with a name (camelCase) and its keyframes. A stage replaces the
preview while the tab is open: type a sequence, play it, replay it.

Effects are part of the theme (`effects` in `greese-theme.json`), so Save
writes them through:

- a retuned entrance preset (`fadeUp`, `popIn`…) is built into the CSS as its
  `@keyframes`, with the kit's `keyframes()` mixin, so it's retuned even when
  played alone as plain CSS;
- every effect, retuned or new, goes into `greese-theme.effects.ts`: a module
  of `defineGreeseEffect()` calls (and the new names in `GreeseEffectRegistry`,
  so they type-check) to import once at the app's entry. A definition under a
  built-in's name replaces it in sequences, interactions and timelines. The
  file exists only while the theme has effects;
- the preview and the pages (homepage, stage) apply them live. The hosted
  studio keeps them in the browser; the Code tab downloads the files.

Reset returns a built-in to the library's keyframes; Delete removes a new one.
Replay motion in the header plays the stage again.

## Theme

Arriving from the homepage keeps the theme you were wearing; the studio
shows it as unsaved when it differs from the theme file.

## Component preview

Above the theme preview, the component chosen in the Components tab (Button
at first, or whatever Inspect picks) is shown through every story on its
docs page. They're the docs' own story files, composed with Storybook's
portable-stories API (`src/preview/stories.ts`), so their args, decorators
and renders apply exactly as in the docs, with the theme being edited
applied. A story added to the docs appears here with no extra work. Each
story renders in a block root, as in Storybook, and honours its `layout`
parameter (`centered`, or `fullscreen` in a short scrolling frame).

## Themes, colors and radius

The **Theme** menu in the header offers starting points (Ocean, Sunset,
Forest…) and **Random**: each replaces the theme's colors and radii and
keeps your component and motion edits. Colors show as chips, light and
dark, each with its full code and "Aa" in its content color, and the weaker
contrast ratio of the two. Chips and swatches show what the preview actually
renders, measured there per scheme, so `color-mix()`, `rgb()` and `var()`
values match exactly; a translucent color shows eight hex digits over a
checkerboard. Open a chip to edit it, along with its strong and content
colors. Radius tokens
are picked as corner shapes, or typed. The other token groups are under
**More tokens**.

## Breakpoints

The **breakpoint** section sets the widths the stylesheet is built with, and adds
keys. Media queries can't read variables, so a change **rebuilds the whole
stylesheet** with the new breakpoints (compiled natively by `npm run studio`,
in the browser in the hosted studio; about a second, once per set of
breakpoints), and the preview uses that build. The theme file records
`breakpoints`; the SCSS starts with
`@use 'pkg:@greese/ui/scss' with ($breakpoints: …)`, and the compiled CSS is then the
whole stylesheet, to use instead of `styles.css`. The Code tab also shows what
the app needs: `configureBreakpoints({ … })`, and, for an added key, the
`BreakpointKeys` declaration for TypeScript. The five built-in keys stay (components use
them), `xs` is always 0, and a key is one word. Each key, added ones included,
gets responsive classes and `--greese-breakpoint-<key>`.

## Typography

The **typography** section edits the type system (ADR 0016): pick a variant
(`p1`–`p3`, `h1`–`h6`, `s1`, `s2`, `caption`, `button`) and a breakpoint, and
set its size, weight, tracking and leading there, or add other properties
such as `transform`. An empty field keeps what it inherits (the placeholder
says what), and **Reset** returns the variant to its defaults. The theme file
holds `typography`; the SCSS writes `greese.typography(…)`.

## Adding tokens

Every token section ends with an "Add a … token" row: name it (lower-case
letters, digits and `-`) and it becomes `--greese-<group>-<name>` in the
generated theme, written as `$extend` in the SCSS. It starts with a value from
its group; edit it like any other, and **Remove** takes it away. A name that
already exists is refused. A new `space` token is a variable only (the
responsive classes are built with the stylesheet). Breakpoints are listed but
not editable: they're fixed when the stylesheet is built.

## Colors

Color fields take any CSS color, or a palette name such as `lavender-600`
(suggested as you type). The kit compiles a palette name to its color, so
the saved SCSS reads `lavender-600` and the CSS has the hex. Setting `primary`
rebrands every component, and its content (readable text on it, WCAG AA)
and strong colors follow unless you set them too.

## Importing an existing theme

**Import**, in the toolbar, takes a theme you already have:

- a studio JSON file;
- `createTheme()` options or output;
- a `.ts`/`.js` module exporting either;
- the kit's SCSS or your own;
- hand-written CSS overrides.

Paste it, upload it, or give a path inside your project. Everything is read
as CSS (SCSS compiled first, modules run, their `createTheme()` CSS taken),
then mapped back to tokens, component rules and motion.

What doesn't fit is listed with its CSS so you can keep it. You can replace
the current theme or merge into it, and save writes to `GREESE_THEME` as
usual.

The importer is `src/importer.ts`. Its tests (`server/importer.test.ts`)
include a round trip: a theme the studio writes reads back unchanged.

## How it works

- **`server/studio.ts`:** a dev-server plugin. It reads and writes the theme
  file and compiles it through the real SCSS kit. It runs under `vite`
  (serve) only and answers same-origin requests only, since it writes files.
- **`src/spec.ts`:** the JSON format and its SCSS generator, shared by the
  server and the page.
- **`src/App.tsx` and `src/panels/`:** the editor, built with GreeseUI.
- **`src/preview/`:** the themed gallery, in an iframe so the theme never
  restyles the editor. Inspect mode reports a clicked element's classes and
  computed variables.

Component data (parts, modifiers, variables) comes from
`@greese/ui/style-manifest.json`, so build the library first
(`npm run build`) after changing its styles.

Design and trade-offs: [ADR 0010](../../docs/adr/0010-theme-kit-and-studio.md).
