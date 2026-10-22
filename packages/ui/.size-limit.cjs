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
    limit: '21 kB',
  },
  {
    name: 'CSS: utilities.css (the whole set)',
    path: 'dist/utilities.css',
    rolldown: false,
    // Opt-in, and rarely shipped whole: a project writes only the classes it
    // uses (`greese-utilities`, ADR 0019).
    limit: '7.5 kB',
  },
  {
    name: 'CSS: base.css',
    path: 'dist/base.css',
    rolldown: false,
    limit: '1 kB',
  },
]
