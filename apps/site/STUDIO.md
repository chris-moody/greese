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

### Where effects are defined

One file defines them: [`packages/ui/src/effects.ts`](../../packages/ui/src/effects.ts).
**Base effects** (`baseEffects`) animate one property and take optional
parameters; **combo effects** (`comboEffects`) are made of base effects by name,
each placed in time as a share of the combo; `builtInEffects` is both. There is
no "kind" to declare. CSS decides from the keyframes: an effect that ends at the
element's resting state is a CSS preset (`@keyframes`), one that ends away from
it is an overlay exit (the `translate` and `scale` it ends at). `cssPlan()` makes
that decision, for the built-ins at build time and for yours.

| Who needs them                | How it gets them from `effects.ts`                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| The runtime (`@greese/react`) | imports `@greese/ui/effects`, plays the keyframes and reads a call's arguments (`fadeIn(0.25, 0.8)`)                           |
| The CSS (`Motion.scss`)       | `build-tokens.ts` writes `dist/_maps.scss` (`$effects`, a plan per effect); Motion.scss writes each with `styles/_effect.scss` |
| The SCSS kit                  | `motion(enter:)` and `motion(exit:)` read the same plans, plus any defined with `effect()`                                     |
| The React resolver            | `dist/effect-classes.js`, generated: the names that end at rest, so no keyframes land in component bundles                     |
| Theme Studio                  | lists, groups (by where each ends), edits and re-imports them from the same exports; the Motion section offers them by plan    |

Why JavaScript at all: CSS plays an effect alone only when it ends at rest.
Sequences, arguments, hover and press, text effects, timelines and non-CSS
eases need the keyframes as data. So the data is TypeScript and the CSS is
generated from it.

**To add or change a built-in effect, edit `effects.ts`** and rebuild
`@greese/ui`. It gets its CSS, kit name, types and Studio entry with no other
change.

### How an edited effect reaches the built theme

Built-in effects and the ones you add go the same way.

1. **Edit.** The Greese tab parses the code as you type. Valid code is written
   to `spec.effects[name]` (`{ keyframes, duration? }`) in `greese-theme.json`;
   code that doesn't parse stays a draft and the theme keeps the last valid
   version. Reset deletes the entry.
2. **Compile** (`compileSpec` in `server/studio.ts`, or `hosted.ts` in the
   browser) produces three things from the spec:
   - `greese-theme.scss`: for each effect in the spec, a
     `@include greese.effect(name, (enter: …))` or `(exit: …)`, from
     `cssPlan(keyframes)`. They come before the components, so a component's
     `motion(enter: …)` or `motion(exit: …)` can name them. The mixin writes the
     same classes and `@keyframes` as the built-ins, in `@layer greese.utilities`
     after the library's own, so a built-in's name is retuned;
   - `greese-theme.css`: that SCSS compiled;
   - `greese-theme.effects.ts` (`specToEffectsTs`): one
     `defineGreeseEffect('name', { keyframes, duration })` per effect in the
     spec, plus `GreeseEffectRegistry` entries for new names.
3. **Use.** The CSS alone plays a lone effect that ends at rest
   (`greese="fadeUp"`), sets what an overlay's `exit` changes, and serves the
   kit's `motion()`. The app imports the `.effects.ts` once at its entry; that
   is what plays the same effect inside a sequence, `hover`, `press`, `focus`, a
   timeline, with arguments, and plays a new effect named in a `greese` prop.
4. **On the homepage**, which loads no compiled theme, `effects-runtime.ts`
   writes the same rules with `effectCss()` (a test keeps it equal to the
   kit's output).

An overlay's `exit` with an effect that only the effects module defines (not in
the compiled CSS) works too: the runtime sets what it changes on the overlay.

A retuned effect is fixed keyframes: it no longer reads its parameters, but
keeps the timing keys (`duration`, `offset`, `ease`).

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
set its font size, font weight, letter spacing and line height there, or add
other properties such as `text-transform`. An empty field keeps what it inherits (the placeholder
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
