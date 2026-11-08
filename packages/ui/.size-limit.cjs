/**
 * Size budgets (brotli) for the stylesheets. The JavaScript budgets are
 * @greese/react's and @greese/js's. See .claude/skills/greese-lightweight.
 */
module.exports = [
  {
    name: 'CSS: greese.css',
    path: 'dist/greese.css',
    rolldown: false,
    // 18 → 20 kB (2026-10-19): the ADR 0011 components' styles, about 2.9 kB
    // after cutting TextRotate to 6 items and ScrollCarousel's responsive gap.
    // Per-component CSS (css/<Name>.css) only ships what's imported.
    // 20 → 21 kB (2026-10-20): the type system (ADR 0016): the default
    // variants' custom properties at four breakpoints, and a class per variant.
    // 21 kB → 21.15 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025):
    // their keyframes and classes, about 0.1 kB.
    // 21.15 kB → 21.5 kB (2026-10-23): wipes and pockets in every direction, arriving
    // and leaving (27 more effects, generated from one table of directions; ADR 0025
    // addendum): keyframes for the six more entrances; exits play in the runtime (21.45
    // kB).
    // 21.5 kB → 21.75 kB (2026-10-23): overlays leave with wipes and pockets too (ADR
    // 0025 addendum): an exit class with its mask for each of the 21 new exits, and the
    // floating mixin's mask (21687 B).
    // 21.75 kB → 22.5 kB (2026-10-23): irises in eight directions, arriving and
    // leaving (16 more effects: keyframes and exit classes), and themes that
    // reassign instead of overwrite (ADR 0025): the motion roles every overlay,
    // toast, backdrop, tab panel and table row reads, and the radius roles
    // (`--greese-corner-*`) components read in place of the scale (22420 B).
    // 22.5 kB → 22.75 kB (2026-10-24): the three-dimensional effects (ADR 0025
    // addendum): keyframes for six entrances, exit classes for six more, and the
    // overlay exit's `transform` and pivot (22.72 kB).
    // 22.75 kB → 23.35 kB (2026-10-24): Header and Footer (a sticky header sets
    // the page's scroll padding), and Collapsible's icon per state with its
    // transitions (23.31 kB).
    // 23.35 kB → 23.4 kB (2026-10-24): an interactive Card's hit strip stays
    // unclipped, so CardMedia rounds its own corners (23.38 kB).
    // 23.4 kB → 23.6 kB (2026-10-27): Progress's `loading` stripes (one rule per
    // engine's fill pseudo-element, which can't share a selector list), and the
    // frames Textarea, FileInput and Menu's viewport gained so shape themes reach
    // them (23.53 kB).
    // 23.6 kB → 24.9 kB (2026-10-29): page transitions (ADR 0029): the 44 exits'
    // keyframes from rest (an overlay's exit only transitions to its end values,
    // so they didn't exist), a view-transition class per effect, and the theme's
    // page roles (24.84 kB). Per-component CSS keeps it off pages that don't use
    // it: css/PageTransition.css, budgeted below.
    // 24.9 kB → 25 kB (2026-10-30): a page's snapshots show only the screenful
    // in view, and a page that left live fades beneath the next (24.97 kB).
    // 25 kB → 25.2 kB (2026-10-30): eight half-turn effects (`flipOver<Dir>`,
    // `flipOverOut<Dir>`, the Depth theme's page change), their keyframes,
    // classes and snapshot rules, and a still header stacked over the page
    // (25.18 kB).
    // 25.2 kB → 25.9 kB (2026-11-01): Carousel (ADR 0032): slides stacked in one
    // cell, the `carousel` motion roles forward and back for each of an exit's
    // ten properties, and the buttons and dots it shares with ScrollCarousel;
    // ScrollCarousel's vertical orientation; Collapsible's margin fix (25.84 kB).
    // Per-component CSS keeps Carousel off pages that don't use it.
    // 25.9 kB → 26.15 kB (2026-11-01): reduced motion an app asks for (ADR 0033):
    // collapsed durations and a cut for every animation, transition and smooth
    // scroll under `data-greese-motion="reduce"`, in core.css too (26.12 kB).
    // 26.15 kB → 26.6 kB (2026-11-04): EditableField's stylesheet — the property
    // row, its label, the color swatch's three states and the dial — plus
    // ColorPicker's channel fields and tool buttons (26.52 kB).
    // 26.6 kB → 26.85 kB (2026-11-05): a slider's value bubble — the wrapper and
    // the zero-size anchor that puts it at the thumb — 141 B of it, on top of
    // 32 B already over before this change (26.77 kB).
    // 26.85 kB → 27.1 kB (2026-11-05): a size scale on Checkbox, Radio,
    // RadioGroup, Switch, Slider and ColorPicker — five classes each, setting
    // the shared control variables — plus NumberStepper's one rule (27.02 kB).
    // 27.1 kB → 27.2 kB (2026-11-08): xs controls the same height everywhere:
    // EditableField's size classes for its colour swatch, the swatch's touch
    // area, Select's line height and Combobox's toggle fitting its field
    // (27.15 kB).
    limit: '27.2 kB',
  },
  {
    name: 'CSS: css/PageTransition.css',
    path: 'dist/css/PageTransition.css',
    rolldown: false,
    // Page transitions alone (ADR 0029), without core.css: exit keyframes and
    // the view-transition rules (1.74 kB).
    // 1.8 kB → 1.9 kB (2026-10-30): the screenful window and the live fade, as
    // above (1.85 kB).
    // 1.9 kB → 2 kB (2026-10-30): the half turns' exit keyframes and snapshot
    // rules, hidden backs, and still groups on top, as above (1.98 kB).
    // 2 kB → 2.05 kB (2026-10-31): the three `--route-*` rules a route's or a
    // navigation's own effects and pace play by (ADR 0029 addendum) (2.02 kB).
    limit: '2.05 kB',
  },
  {
    name: 'CSS: utilities.css (the whole set)',
    path: 'dist/utilities.css',
    rolldown: false,
    // Opt-in, and rarely shipped whole: a project writes only the classes it
    // uses (`greese-utilities`, ADR 0019).
    // 7.5 kB → 8.15 kB (2026-11-01): SVG paint (ADR 0031): `fill-*` and `stroke-*`
    // in every theme color with their `hover-` forms, and `stroke-width-*` (8.1 kB).
    limit: '8.15 kB',
  },
  {
    name: 'CSS: base.css',
    path: 'dist/base.css',
    rolldown: false,
    limit: '1 kB',
  },
]
