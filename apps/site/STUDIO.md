# Theme Studio

The `/studio` route of the web app in `apps/site` (ADR 0018), which
also holds the homepage. It's a local web app for building a greese ui theme: tokens, component overrides
and theme-wide motion, previewed live on real components and saved to your
project as files.

```sh
npm run studio                                             # a working copy of the example theme (.local/, untracked)
GREESE_THEME=src/styles/greese-theme.json npm run studio   # your own
```

`GREESE_THEME` is resolved from the directory you ran npm in. It opens on
<http://localhost:5180/studio>.

### On a phone or another device

Start it on the network, then open the **Studio on another device** link it
prints beside Vite's Network URL:

```sh
npm run studio -- --host
#   ➜  Network: http://192.168.1.5:5180/
#   ➜  Studio on another device: http://192.168.1.5:5180/studio?studio-token=…
```

Every page loads from another device without it, but the studio's API (load,
compile, save, import) answers this machine only, or a device that has opened
that link once: the API writes files and runs the modules you import, and on
a network anyone could send it a request. The link signs the device in with a
cookie, so it keeps working across restarts. To sign every device out, delete
`apps/site/.local/studio-token`.

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

## Motion tab

Theme-wide entrance tuning (duration, delay, ease, distance and stagger for
every `greese` prop entrance), the theme's **Roles** (which effect plays where,
and which duration and easing it takes: `motion-defaults()`, ADR 0025), a note
on scopes, and the theme's **Effects**. Every built-in effect is listed with the
keyframes it plays, as read-only code: a built-in always does what its name
says. Copy one to edit it, or add an effect of your own with a name (camelCase)
and its keyframes, then assign it to a role or name it in a `greese` prop. A stage replaces the preview while the tab is
open: type a sequence, play it, replay it; an effect's Play runs it there.

Effects are part of the theme (`effects` in `greese-theme.json`), so Save
writes them through:

- each one that ends at rest is built into the CSS as its `@keyframes`, with
  the kit's `effect()` mixin, so it plays alone as plain CSS;
- every one goes into `greese-theme.effects.ts`: a module of
  `defineGreeseEffect()` calls (and the names in `GreeseEffectRegistry`, so
  they type-check) to import once at the app's entry. A built-in's name is
  refused, by the spec check, the kit and the runtime alike. The file exists
  only while the theme has effects;
- the preview and the pages (homepage, stage) apply them live. The hosted
  studio keeps them in the browser; the Code tab downloads the files.

Delete removes one of yours.
Replay motion in the header plays the stage again.

**Pages** (ADR 0029) sets how a page change plays: the page roles (`page`,
`page-exit` and their `back` forms, the pace, stagger, exit order and mode,
written into `motion-defaults()`), and **parts of a page**, selector rules
with motion of their own (`pageRules` in `greese-theme.json`, written with the
kit's `page-transitions()`): a rule keeps its elements still, or gives them
their own entrance, exit, duration, delay and ease. The stage's "Change pages"
plays them, forward and back. It sets the page roles on the editor's root
while it's shown, since a view transition's snapshots inherit from the root.
The preview's "Page transition" tile plays them in the compiled theme. Both
import back from a theme's CSS.

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

1. **Edit.** The Motion tab's Effects section parses the code as you type. Valid code is written
   to `spec.effects[name]` (`{ keyframes, duration? }`) in `greese-theme.json`;
   code that doesn't parse stays a draft and the theme keeps the last valid
   version. Reset deletes the entry.
2. **Compile** (`compileSpec` in `server/studio.ts`, or `hosted.ts` in the
   browser) produces three things from the spec:
   - `greese-theme.scss`: for each effect in the spec, a
     `@include greese.effect(name, (enter: …))` or `(exit: …)`, from
     `cssPlan(keyframes)`. They come before the components, so a component's
     `motion(enter: …)` or `motion(exit: …)` can name them. The mixin writes the
     same classes and `@keyframes` as the built-ins, in `@layer greese.utilities`,
     under names of the theme's own (a built-in's is refused);
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

A theme's effect is fixed keyframes: it reads no parameters, but keeps the
timing keys (`duration`, `offset`, `ease`).

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

### Anatomy

Above the stories, the first one is shown again as the component's **anatomy**
(`src/studio/preview/Anatomy.tsx`): every element that belongs to the component,
to what it contains and to what it is built on is outlined, and labelled in a
gutter to the right with the `greese-*` classes it carries. Nesting shows as
colour, every disclosure starts open so each section is visible (an exclusive
Accordion's shared `name` is dropped) and can be closed and opened again, and the same tree is listed as text under
it. The elements are found by walking the rendered DOM, so what is labelled is
what is there. It measures again when the theme's CSS changes and when a disclosure opens
or closes.

## Component styles

Themes are more than tokens: the **Components tab** edits a component's own
styles. Its **Styles** box is the code of a component _family_, edited together,
in a highlighted editor (`src/studio/CodeEditor.tsx`, which colours CSS, SCSS and
the JavaScript effects are written in, with no dependency: the text is
tokenized by `src/studio/highlight.ts` and drawn under a transparent textarea).

- **The family** is derived, not listed: the component's own style blocks, then
  those of the components that go inside it (the `subcomponents` its story
  file names) and what they are built on (`component-styles.json`, read from each
  component's source). Accordion: Accordion, AccordionItem, Collapsible.

### One SCSS box, starting from the library's own

- **It starts as the family's library SCSS:** every stylesheet the family is
  built from (Accordion.scss, Collapsible.scss), each under a `// src/components/…`
  comment, made to fit the box (`familySource` in `src/studio/copySource.ts`):
  library paths become `pkg:` imports, written once at the top; the `@layer`
  wrapper goes; the component's class becomes `&` and its modifiers
  `&.greese-Accordion--x`, in the selectors of outer rules only (inside another
  rule, as in `.greese-AvatarGroup-item > .greese-Avatar`, it is another
  element and stays a class); what writes the library's own classes
  (`mixins.responsive-prop`, `tones.classes`) is left out, with a comment; and
  rules about components outside the family are dropped (AccordionItem's box has
  no `.greese-Accordion` rules).
- **Nothing is kept until you edit it.** Then the theme keeps the whole text
  (`components.<Name>.scss`) and writes it inside
  `@include greese.component(Accordion) { … }`, so it applies under the
  component's class only (`.greese-Accordion .greese-Collapsible-trigger`), in
  the overrides layer, and a named theme's attribute comes from the kit. A
  Collapsible or AccordionItem used on its own keeps the library's styles, or its
  own box's if you edit that. Editing the text back to the library's, or
  **Reset**, drops it. The copy is yours and won't follow later library changes.
- **Imports.** The **Imports** menu lists what the box can `@use`, with a
  checkbox each: the library's entry points (`pkg:@greese/ui/scss/kit` as
  `greese`, `config`, `maps`, `mixins`, `tones`, `floating`, `controls`) and
  `sass:map`, `list`, `math`, `string`, `color` and `meta`. The boxes are read
  from the text, so typing or deleting a `@use` ticks or clears its box; ticking
  adds the line after the last import, unticking deletes it (`toggleImport` in
  `src/studio/scssModule.ts`). A library path pasted from a component's source
  (`../../styles/mixins`) is rewritten to its `pkg:` form as you type, so the
  theme compiles in your project. `with (…)`, `@forward`, `@import`, a `@use`
  after the styles, and anything else are refused, with the line (ADR 0021).
- **One file.** The theme file writes every component's imports once, at the top
  (after the kit and any breakpoints, which the partials read), then the
  top-level `@mixin`s, `@function`s and the variables they read, then each body
  inside `component(Name)`. Two components giving one name to two modules, or
  declaring the same mixin, is an error naming both.
- **Errors in place.** A compile error in a component's SCSS is marked on its
  line in the box, with Sass's message under it; the preview keeps the last CSS
  that compiled. (`specToScssWithLines` records where every line of the generated
  file came from.)

It applies live: the spec compiles through the real kit and the CSS goes to the
preview. The family is `src/studio/family.ts`. Every component's source compiles
in its box, and so does each family's starting text (tests, against the real
kit).

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
- **`src/App.tsx` and `src/panels/`:** the editor, built with greese ui.
- **`src/preview/`:** the themed gallery, in an iframe so the theme never
  restyles the editor. Inspect mode reports a clicked element's classes and
  computed variables.

Component data (parts, modifiers, variables) comes from
`@greese/ui/style-manifest.json`, so build the library first
(`npm run build`) after changing its styles.

Design and trade-offs: [ADR 0010](../../docs/adr/0010-theme-kit-and-studio.md).
