# ADR 0025: A theme is three layers: colors, shapes, motion

- **Status:** Accepted
- **Date:** 2026-10-23
- **Amends:** ADR 0023 (its themes set colors) and ADR 0024 (more components take shapes)

## Context

The theme menu mixed concerns:

- **Color presets set radii.**
- **Shape themes set colors.**
- **Motion had no presets at all.**

Choosing one undid parts of another, and you couldn't pair Ocean's colors with
Bevel's shapes without editing by hand.

Coverage was also thin:

- Shapes reached five components. Segments, chips, avatars, status dots,
  inputs, tabs, accordions and overlays kept the library's rectangles.
- Small buttons took the same cuts as large ones.
- Color presets only changed the brand colors. The page around them looked
  the same in every theme.
- Tabs and the site's own navigation had no visual identity, even in the
  base theme.

## Decision

**A theme is three independent layers, one of each at a time.** A preset of
each kind writes its own fields of the spec and no others. Choosing one leaves
the other two as they are. A test checks every preset against its layer.

| Layer  | Writes                                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Colors | `tokens.color`: brand colors **and the neutrals** (canvas, surfaces, text, borders), tinted from one hue in both schemes, text checked for AA on every surface |
| Shapes | `tokens.corner` (the radius roles), `shapes`, each component's `shape`, and structural component SCSS (an accordion's spacing, Folio's folder tabs)                      |
| Motion | `motionDefaults`: the entrance pacing, and the motion roles (which effect plays where, which duration and easing it takes)                                                |

Every layer **reassigns**: it points roles at values that keep their own (the
addendum "Themes reassign" below). Only the shape layer writes component SCSS. The header's theme picker shows the three as separate
groups:

- the button is the brand colors as a diamond, a shape icon and a motion icon,
  each icon solid when that layer has a theme;
- each shape theme is listed with its control drawn small, from the shape's
  own points.

### Shapes reach the library by role

A shape theme defines one shape per role and assigns it to every component in
the role:

| Role | Components |
| --- | --- |
| control | Button and the speed dial |
| field | Input |
| container | Card, Dialog, Popover, Menu, Toast, Tile, AccordionItem |
| small | Alert and Tooltip |
| indicator | Badge, Chip, Segment, the segmented control's track |
| mark | Avatar and Status |
| tab | Tab |

`SHAPE_TARGETS` in `@greese/ui/shapes` says how each component takes a shape:

- **which element:** a component's shape can go on a part, such as the speed
  dial's trigger;
- **whether a border layer fits:** off where the component has no border, no
  free pseudo-element, or scrolls its own content (a border layer would scroll
  with it);
- **how focus shows:** fields and segments, focused while in use, draw a focus
  ring inside the shape; tabs keep their inset outline;
- **smaller features for smaller sizes:** `scale`, so an icon button takes half
  a button's cut.

A pulsing status dot and an avatar in a group keep their round: the first
draws its pulse outside the dot, the second a separating ring outside the
avatar.

### Motion themes

Snappy, Gentle, Wipe and Pocket set the entrance pacing and assign the motion
roles (see the addendum "Themes reassign"). They give the content that switches
one consistent way to arrive:

- **Tab panels:** as their tab is chosen.
- **An accordion's content:** as it opens.
- **Toasts.**
- **Overlays.** Dialogs, popovers and menus already fade and move on their own
  transitions, so their entrances only reveal, and they leave with a built-in
  exit.

**Wipes and pockets are masks, never `clip-path`.** The clip belongs to the
element's shape (ADR 0024), and a mask composes with it. A pocket moves the
element up while its mask grows by the same distance, so the window it shows
through stays where the element will rest. `cssPlan` counts mask properties as
at rest: the element has no mask of its own, so it is at rest once the
animation ends. When a mask is involved, it keeps the last step, so the reveal
completes before the mask goes.

### The base theme gains identity

- The current tab has a tinted background over its underline. A tab panel
  enters (a short fade and rise) each time its tab is chosen.
- The site's header links are pills, tinted on hover and for the current
  section or page.

## Consequences

- Shape theme files are 2.1–3 kB with brotli; motion theme files, only role
  assignments and the keyframes they name, are 0.35–0.6 kB.
- A motion theme's tab panels, rows, toasts and overlays take the durations it
  assigns to their roles; the duration tokens, and so components' own
  transitions, are the same under every motion theme.
- Popovers, menus and tooltips are clipped but draw no ring: their own border
  shows on straight edges and is cut where the shape cuts.
- A color theme now changes the page as well as its accents. A theme that
  wants the library's neutrals sets brand colors only, as Greese does.

## Addendum (2026-10-23): reaching everything

**Pinked is Ridge.** A rename, nothing else.

**Round parts are a token.** The parts that stand for something were drawn
with a literal `border-radius: 50%`, which no theme could reach:

- switch knobs, slider and color-picker thumbs;
- radios, step markers, carousel and speed-dial buttons;
- avatars, status dots, the circular skeleton.

They read `--greese-radius-round` (`50%` by default); now through the `round`
radius role, which the square shape themes point at `none` (see "Themes
reassign"). Bevel and Ridge also turn knobs, thumbs and radios a quarter, to
diamonds, and give avatars and status dots a diamond shape. Spinners, radial
progress and the loading ring stay round, because they turn or draw arcs.

**Wipes and pockets are built-in effects** (ADR 0008's set, `src/effects.ts`):

- `wipeRight`, `wipeLeft`, `wipeUp` and `wipeDown`;
- `wipeOpenX` and `wipeOpenY`, from the middle;
- `wipeDownRight`, `wipeDownLeft`, `wipeUpRight` and `wipeUpLeft`, from a
  corner;
- `irisIn`;
- `pocketUp`, `pocketDown`, `pocketRight` and `pocketLeft`.

A base effect may hold properties fixed throughout (`fixed`: a mask's image,
repeat and anchor) beside the one it animates. A pocket is a slide combined with
a wipe anchored at the far edge, growing by the same distance. Fifteen more
names raise every component's budget by about 40 B: the static part lists the
entrances CSS can play, to know when the runtime is needed. The runtime grows
by about 0.3 kB, and `greese.css` by about 0.1 kB.

**Motion themes retune the built-in entrances** (superseded: see "Themes
reassign"). A theme redefines `fadeUp`,
`fadeIn`, `fadeDown`, `fadeStart`, `fadeEnd` (and, in Wipe, `scaleIn` and
`popIn`) in its own style: a wipe, a pocket, a float, a snap. Anything using
them, a `greese` prop or a scroll reveal, then arrives the theme's way. Before,
only their pacing changed, so the page still faded up.

**Content that switches stays put; its children enter.** A tab panel, and an
accordion's content as it opens, keep their place while their children enter a
stagger apart (`mixins.content-entrance`). Not when the container has a `greese`
entrance of its own. A motion theme changes only the keyframes' name. Its table
rows enter one after another.

**The theme and the color scheme persist.** `createStoredValue()` (@greese/ui)
keeps a value in storage, safely:

- an in-memory fallback where storage is missing, blocked or full;
- parsing with optional validation;
- change notifications in this tab and across tabs.

`useStoredState()` (@greese/react) is the React side. `useColorScheme` uses it
too, keeping the plain-text format the pre-paint script reads. The site keeps
the worn theme under its own key, apart from the hosted studio's explicit save.
The studio's editor wears the theme like every page.

**Wipes and pockets go every way, arriving and leaving.** Eight directions (the
four sides and the four corners), plus the middle:

- **Wipes:** `wipe<Dir>`, `wipeOut<Dir>`, `wipeOpenX/Y`, `wipeCloseX/Y`,
  `irisIn` and `irisOut`.
- **Pockets:** `pocket<Dir>` and `pocketOut<Dir>` (`pocketOpenX/Y` and
  `pocketCloseX/Y` were removed later: too close to the wipes from the
  middle to earn their place).

They are generated from one table of directions. A pocket travels its whole
size by default (`distance: '100%'`), so it starts or ends out of sight.

A mask's size is at rest only when it shows the whole element, so an effect
that ends masked away is an exit.

**Overlays leave with them too.** An overlay's exit is a CSS transition. Its
plan now carries the mask it ends at, beside `translate` and `scale`, and the
floating enter/exit mixin holds that mask: inert unless an exit sets it,
showing everything while open, sized away as it closes. A pocket's exit is its
slide and its mask, carried together by the closing transition.

**Motion themes set overlays' entrances and exits,** unless an instance's own
`greese` sets them:

| Theme | Dialog | Popover, menu | Tooltip | Toast |
| --- | --- | --- | --- | --- |
| Snappy | scale in and out | scale in and out | scale in and out | pop in |
| Gentle | blur in, fade out down | blur in, fade out down | blur in, fade out down | fade up |
| Wipe | iris in and out | wipe down, wipe out up | open and close from the middle | open from the middle |
| Pocket | wipe up, sink into a pocket below | wipe down, lift into a pocket above | wipe up, sink below | rise out of a pocket |

An overlay's own transition already fades and moves it, so its entrances only
add what doesn't fight that: a mask, or a scale.

The overlay exits now include the wipes and pockets, 32 names in all. The
names every component carries are written as prefixes times directions, a few
bytes for the 32 that follow a direction.

**Components don't impose motion on overlays.** A component may say what it
is (where an overlay opens from), never how it moves. The theme supplies that;
an instance's `greese` prop overrides it. So popovers, menus, tooltips,
dialogs, drawers, the sidebar and speed-dial actions have no transitions or
`@starting-style` of their own (styles/_floating.scss):

- **Arriving:** an animation, `--greese-motion-overlay-enter` (since split
  into the overlay roles: "Themes reassign"). The base theme's
  is a short fade from the overlay's origin.
- **Leaving:** the exit variables (`--greese-motion-exit-*`). The base theme
  fades back toward the origin.
- **Origin:** `--greese-overlay-origin` is the only thing a component sets: a
  dialog rises, a popover drops from its trigger, a drawer comes from its edge.

One transition remains, and it is plumbing, not motion. A closing overlay must
stay rendered (`display` and `overlay`, allow-discrete) while the theme's exit
plays, over the theme's exit timing (`--greese-motion-exit-duration`, `-ease`).
Without it, nothing could leave.

A dialog's backdrop and a toast follow the same rule:
`--greese-motion-backdrop-enter` and `--greese-motion-toast-enter` (now the
`backdrop` and `toast` roles). With no
opening transition to fight, a motion theme's overlay entrances can move:
Pocket's overlays rise out of slots now. Drawers share the dialog class, so the
motion themes keep them sliding from their edge in the theme's timing.
Overlays' shapes stay still, so they don't replace the transition that keeps
them rendered.

## Addendum (2026-10-23): themes reassign

A motion theme used to redefine built-in effects (`fadeUp` became a wipe) and
overwrite the duration and easing tokens; a shape theme set the radius scale to
0. So a chosen effect no longer did what its name said, and a token's value
depended on the theme. Themes now only **reassign**: they point roles at
values, and the values keep their own.

| Layer | Its roles | Point at |
| --- | --- | --- |
| Colors | `primary`, `surface`, `fg`… | the palette |
| Shapes | `--greese-corner-control`, `-field`, `-surface`, `-panel`, `-inset`, `-pill`, `-round` | the radius scale (`none` for the square themes) |
| Motion | `theme`, `content`, `rows`, `toast`, `backdrop`, `overlay`, `dialog`, `popover`, `tooltip`, `drawer`, their `-exit`s, the `*-duration`s, `enter-ease`, `exit-ease` | effects, duration and easing tokens (or values of their own) |

- **Components read roles.** The radius roles are a token group (`corner`),
  each defaulting to a step of the scale. Motion roles are custom properties
  the library reads with the base theme's choice as a fallback
  (`mixins.role-entrance`, `floating.motion-role`): tab panels and an opening
  accordion's children (`content`), table rows (`rows`, none by default),
  toasts, a dialog's scrim, and every overlay by kind. A drawer takes `drawer`,
  not `dialog`, so it keeps sliding from its edge without a reset.
- **The kit assigns them** with `motion-defaults()`, checking effect names and
  writing token names as `var()`s. It carries the assigned entrances' own
  keyframes, so a theme file works on a page without the Motion styles.
- **Built-ins keep their keyframes.** The kit's `effect()` refuses a built-in's
  name, the runtime plays the built-in before any definition, and Theme
  Studio's built-ins are read-only (copy one to start your own).
- **`'theme'`** is a `greese` entrance that plays the `theme` role (`fadeUp` in
  the base theme). The homepage's and the templates' reveals use it, so a page
  arrives the way its theme does.
- **Complete exits.** An exit sets everything an overlay moves to (translate,
  scale, opacity, its mask, `mask-image: none` without one), so an instance's
  exit never mixes with a role's around it.
- **Irises go every way:** `iris<Dir>` and `irisOut<Dir>`, the eight directions,
  beside `irisIn` and `irisOut`. An entrance is its exit reversed (`irisRight`
  opens from the right side, which `irisOutRight` closes toward). An iris is
  an ellipse in the element's proportions, open at 142% (√2, just past the
  far corner from the middle, a side or a corner): a circle would need the
  element's aspect ratio, which a mask doesn't know, and opening to 300% left
  most of the run invisible, so entrances finished early and exits started
  late.
- **Reveals read the box.** A scroll reveal waited for IntersectionObserver to
  report the element 99% visible, which a shape's clip-path prevents: shaped
  pages never revealed. It now checks the element's box as the page scrolls,
  while any of it is in view.
- **A `track` color** for the empty part of progress bars, sliders and radial
  progress: a step lighter than the borders in dark mode, so it shows on the
  canvas and on surfaces.

**Cost:** `greese.css` 21.75 → 22.5 kB (the 16 irises and the roles), and a few
bytes on four JS budgets for the iris names (`.size-limit.cjs` says each).

## Addendum (2026-10-24): depth, rounder themes, variants

**Four more shape themes.** Soft and Pebble only reassign radius roles: Soft
a step rounder everywhere, Pebble pills and circles (containers take the new
`xl` step of the radius scale, 24px, because a pill on a box of several lines
cuts into its text). Extrude and Tilt add depth two ways, distinct on purpose:

- **Extrude** draws it: inset shadows, a dark band along a raised part's lower
  edge and a highlight along its top, a shadow along a recessed field's top.
  Inside the box only, so a motion theme's mask or a shape's clip never cuts
  it off, and nothing moves the layout. Pressed, a control sinks by
  `transform`.
- **Tilt** uses real perspective, on hover and press only: nothing rests
  turned, so a motion theme's turns start and end where the element sits.

Both move things with `transform`, beside the `translate`, `rotate` and
`scale` that effects animate, so the two compose.

**Three-dimensional effects, and Depth.** `turnX`, `turnY`, `hinge` and
`depth` are base effects on `transform` with its own `perspective()`, so they
foreshorten with no `perspective` on a parent; `flip<Dir>`, `flipOut<Dir>`,
`depthIn`, `depthOut`, `swingIn` and `swingOut` are combos with a fade. An
exit carries `transform` (and a swing its pivot), so overlays leave with them:
the floating mixin transitions `transform` and holds `transform-origin`.
Depth assigns them: reveals and panels flip up, menus swing, dialogs rise from
behind the page.

**Color variants.** How a color theme is worn, part of the color layer:
`outline` outlines what is filled and fills what is outlined. A variant writes
components' `modifiers` and `styles` (the colors each component variant draws
with, and a shape's ring), never component SCSS, which is the shape layer's,
so every variant goes with every shape theme; a test checks each pair.

**Four brand colors stay.** The site used primary everywhere, secondary once,
tertiary never and accent four times, so a theme's four colors were mostly
unseen. Dropping one would break every toned component and every theme; the
site gives each a job instead (`apps/site/src/tones.ts`): primary for actions
and where you are, secondary for structure (section eyebrows), tertiary for
measurements, accent for what's new, and sets of equals (the reasons, the
stats) take all four in turn. The theme picker's diamond now sits on the
theme's canvas color.

**The picker shows what's worn:** the shape theme's sample and the motion
theme's first two letters, the plain icons when none is.

**Old worn themes migrate.** A theme stored before themes reassigned roles
loses what the old presets overwrote (the zeroed radius scale, the timing
tokens, redefined built-ins, the old components' motion and SCSS), so the
default shapes are round again.

**Shaped cards no longer transition `translate`** unless interactive, as
without a shape: a restated transition lagged the runtime's effects behind
their masks, so a pocket's window drifted with the card.

**Scroll reveals read the element's box** while any of it is in view: a
shape's clip-path kept IntersectionObserver's ratio under the 99% a reveal
waited for.
