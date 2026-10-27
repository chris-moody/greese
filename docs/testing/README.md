# Testing GreeseUI

The one place that says how this repository is tested: what each layer
proves, where its tests live, how to write and run them, and what CI runs.
The decisions behind the gates are in
[ADR 0006](../adr/0006-distribution-and-quality-gates.md); the latest audit of
the tests is [audit-2026-10-26.md](audit-2026-10-26.md).

## The layers

| Layer                | Proves                                                                                                                   | Lives in                                                                                                | Runs on                                                                                         | Command                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Unit**             | Behaviour, ARIA, keyboard logic, the class and variable contract, pure helpers, SCSS kit output, server-component safety | `packages/*/src/**/*.test.ts(x)`, `packages/*/scripts/*.test.ts`, `apps/site/{src,server}/**/*.test.ts` | Vitest; jsdom for DOM packages, Node for SCSS and server code                                   | `npm test`                                        |
| **e2e (playground)** | What jsdom can't do: layout, computed styles, real focus, the top layer, pointer and touch, scrolling                    | Fixtures in `apps/playground/src/pages/<Page>.tsx`, specs in `apps/playground/e2e/<area>.spec.ts`       | Playwright: Pixel 7, Desktop Chrome, Firefox, WebKit, iPhone 15, against the **built** packages | `npm run test:e2e -w playground`                  |
| **e2e (site)**       | The web app: Theme Studio, the docs at `/docs`, the header and search                                                    | `apps/site/e2e/*.spec.ts`                                                                               | Playwright, Desktop Chrome, on the dev server (warmed by `e2e/warm.ts`)                         | `npm run test:e2e -w site`                        |
| **Visual**           | Every story looks as it did: light and dark, phone (390 px) and desktop (1280 px)                                        | `apps/playground/e2e/visual.spec.ts`; baselines in `e2e/__screenshots__/<platform>/<phone\|desktop>/`   | Playwright Chromium against the built Storybook, reduced motion                                 | `npm run test:visual -w playground`               |
| **Lighthouse**       | Performance, accessibility and best practices ≥ 0.95; LCP < 2 s, TBT < 100 ms, CLS < 0.05, mobile throttled              | `apps/playground/lighthouserc.cjs` (every playground page), `apps/site/lighthouserc.cjs` (the homepage) | Lighthouse CI on the production build                                                           | `npm run lighthouse -w playground` (or `-w site`) |

Around them, other gates catch what tests don't: `check-types` (including the
type-level check that every component takes the `greese` prop), `lint`
(including story and prop-doc coverage), `size`, and `verify:packages`. The
full list with commands is in the `greese-verify` skill.

## Choosing the layer

Test each behaviour once, at the cheapest layer that can see it.

| The behaviour is…                                                                                                        | Test it in                    |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| Roles, names, ARIA state, keyboard handling in your code, callbacks, controlled/uncontrolled state                       | Unit                          |
| The classes, `data-*` attributes and inline custom properties a component renders (the shared markup contract, ADR 0014) | Unit                          |
| A pure helper (`paginationRange`, `ratingAt`, `isReady`…)                                                                | Unit, by calling it           |
| SCSS output (kit, mixins, manifest, themes)                                                                              | Unit, in the Node environment |
| Safe to render from a Server Component                                                                                   | Unit, with `functionProps`    |
| Sizes, positions, wrapping, breakpoints, container queries                                                               | e2e                           |
| Real focus movement, focus traps, `:focus-visible`, the top layer, light dismiss                                         | e2e                           |
| Pointer, touch, drag, hover, scrolling, scroll snapping                                                                  | e2e                           |
| Cross-engine CSS support (Firefox, WebKit)                                                                               | e2e                           |
| How it looks                                                                                                             | Visual (automatic per story)  |
| Load and runtime cost of a page                                                                                          | Lighthouse                    |

If a unit test already proves it, don't repeat it in e2e: every playground
test runs in five projects. An e2e test asserts what only a browser can tell
(a box, a computed style, where focus went), not attributes jsdom renders the
same way.

## Rules for every test

- **Test outcomes, not implementation.** Assert what a user, a screen reader
  or a consumer's CSS can observe. Don't call private functions, count
  internal observers or assert how a change was made (`el.style.translate ===
''`). The public contract includes classes, parts, `data-*` attributes and
  per-instance variables, so asserting those in unit tests is fine; in e2e,
  check what the variable does (the filled width), not its value.
- **Query like a user.** `getByRole` with a name first, then label and text;
  an ARIA relationship (`controlledBy()` follows `aria-controls`); a test id
  when nothing accessible names the element; a part class only for what is
  `aria-hidden` and drawn, like a rating's stars or an OTP field's boxes.
- **Never sleep.** No `waitForTimeout` and no wall-clock bounds. Wait for the
  state: web-first assertions (`toBeVisible`, `toHaveText`), `expect.poll`
  for computed styles that transition, or the element's animations finishing.
- **No magic values.** Read expected token values from `@greese/ui` (`color`,
  `space`, `radius`, `typography`, `breakpoints`) instead of hard-coding
  `8px` or `900`.
- **Assert the classes that matter,** with `toHaveClass`, not an exact
  `className` string.
- **Independent and deterministic.** Each test sets up its own state (clear
  storage, reset media), uses fake timers or frames for time, and leaves
  nothing behind (restore mocks and globals in `afterEach`).
- **One behaviour per test, named for it.** Names read as a sentence about the
  behaviour ("closes on Escape and returns focus"), never about the code.
- **Accessibility in every component test.** End a component's main behaviour
  test with `await expectNoAxeViolations(container)`, rather than a separate
  test that renders it again.

## Unit tests

**Where:** React components are grouped by area in
`packages/react/src/components/<area>.test.tsx` (`layout`, `forms`,
`content`, `overlays`, `gaps`, `ported`, `catalogue`, `motion`, `scope`,
`landmarks`, `typography`); add a `describe('<Name>')` to the right one, or a
new area file.

**Helpers** in `packages/react/src/test/`, installed by `vitest.setup.ts`:

| Helper                                                            | Use                                                                                 |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `expectNoAxeViolations(el)`                                       | axe with color contrast off (jsdom can't render); contrast is covered by Lighthouse |
| `setMedia({ width, dark, reducedMotion })`                        | Drives the fake `matchMedia`: breakpoints, color scheme, reduced motion             |
| `installTopLayer()`                                               | `<dialog>` and the Popover API, state and events only; real behaviour is e2e's      |
| `functionProps(node, server)`                                     | Lists functions handed to the DOM, to prove a component is Server Component safe    |
| `greeseCoverage.ts`                                               | Type-level: fails `check-types` if an exported component lacks the `greese` prop    |
| `installIntersectionObserver()`, `intersect(entry)`, `watching()` | A fake `IntersectionObserver`: `intersect` plays a scroll for every watched element |
| `fakeFrames()`, `restoreFrames()`                                 | Fake greese.js's clock; restore after flushing the ticker's last frame              |

**Time:** use `vi.useFakeTimers()`; for greese.js, `fakeFrames()` in the test
and `restoreFrames()` in `afterEach`.

**SCSS and Node-only code:** add `// @vitest-environment node` and compile
with `@greese/ui`'s `src/test/sass.ts`: `compileScss()` against the library's
source stylesheets, `compileAsProject()` by package URL as a consumer does.
Read the output with `rules(css, selector)` (each rule's enclosing at-rules
and declarations) or `blocks(css)` (every block, in order), not regular
expressions over the text: those break when Sass changes a line break or an
indent, and say nothing about which `@media` or `@layer` a rule is in.

**Coverage:** `@greese/react` runs with coverage, and
`src/utils/responsive.ts` must stay at 100%.

**Run one file:** `cd packages/react && npx vitest run src/components/forms.test.tsx`.

## e2e tests

**Playground fixtures.** Each area has a page in
`apps/playground/src/pages/`, registered in `src/main.tsx` and opened as
`/?page=<name>`. Give elements test ids only where roles can't find them.
A new page also goes in `lighthouserc.cjs`.

**Specs.** `apps/playground/e2e/<area>.spec.ts`, opening the page in a
`beforeEach` with `openFixture(page, '<name>', (p) => <an element on it>)`.
Shared helpers are in `e2e/support.ts`:

| Helper                                              | Use                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `controlledBy(control)`                             | The element a control's `aria-controls` names: a carousel's scroller, a tab's panel        |
| `computed(locator, ...props)`, `style()`            | Computed style values, custom properties included                                          |
| `box(locator)`                                      | The bounding box, failing clearly if there is none                                         |
| `atLeast(page, 'md')`                               | Viewport at or above a breakpoint, read from `@greese/ui`                                  |
| `isTouch()`                                         | The project has a touch screen (Pixel 7, iPhone 15)                                        |
| `px(token)`, `rgb(hex)`                             | Token values as the browser computes them                                                  |
| `settled(locator, { frames })`                      | Waits until the element stops moving (CSS and greese.js); a large `frames` proves it stays |
| `leaves(locator, prop, from)`, `frames(locator, n)` | Waits for a value to start changing, or for `n` rendering frames                           |
| `shownAcross(locator)`                              | How much of an element a `clip-path: inset()` shows, in %: a rating's fill, a diff's side  |

Write the test once and let it run
in every project, branching on the project only where behaviour differs
(touch versus mouse, the md breakpoint), with `test.skip(condition, reason)`
for what doesn't apply.

**Traps:**

- touch projects need `page.touchscreen`, and have no hover;
- rounded corners aren't hit-testable: tap a few pixels in;
- component CSS transitions need `expect.poll`;
- never return a thenable (a greese.js timeline) from `page.evaluate`;
- `scrollbars.spec.ts` turns on space-taking scrollbars, which only Chromium
  honours.

**Site specs** run on the dev server; `e2e/warm.ts` compiles the studio and a
docs page first, so the first test doesn't time out.

**Run:** build first (`npm run build`), then
`cd apps/playground && npx playwright test e2e/<area>.spec.ts`, or one project
with `--project=webkit`.

## Visual regression

Every Storybook story is captured in light and dark, at phone and desktop
sizes, with reduced motion so motion stories show their final state.
Stories must be deterministic: no autoplay, randomness or dates.

- **Compare:** `npm run build -w docs && npm run test:visual -w playground`.
- **Re-record after an intended change:**
  `npx playwright test -c playwright.visual.config.ts --update-snapshots -g "<story-id-prefix>"`
  in `apps/playground`, then **open the new images**, light and dark, phone
  and desktop, and run the comparison twice for stability.
- **Baselines are per platform.** macOS (`darwin`) ones are recorded locally;
  Linux ones only by the Visual workflow's `update` run, whose artifact goes
  in `e2e/__screenshots__/linux/`.
- Delete the baselines of renamed or removed stories.

## Lighthouse

`npm run build`, then `npm run lighthouse -w playground` (every playground
page) or `npm run lighthouse -w site` (the homepage). Three runs per URL,
mobile emulation with slow 4G and a 4× CPU slowdown. Reports go to
`lighthouse-report/`. INP needs real interactions, so Total Blocking Time is
its lab proxy; interaction latency is benchmarked against MUI with
`npm run bench -w playground`.

## What CI runs

| Workflow                       | Runs                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml` (push and PR to main) | build, `verify:packages`, `check-types`, `lint`, `format:check`, `test`, `size`, `test:e2e` (one app at a time), Lighthouse for the playground |
| `visual.yml` (PRs)             | Visual regression in the official Playwright image, against the Linux baselines (a notice until they exist)                                    |

## Measuring the suite

`npm run test:dashboard` opens a local dashboard
([tools/test-dashboard](../../tools/test-dashboard/README.md)) that runs any
of the suites and reports the time of the run, each suite, file and test, the
files each test file loads, and signals of redundant tests. Use it before and
after changing many tests.

## Writing tests for a feature

The `greese-testing` skill walks through all four layers for a new feature or
change, and the `greese-test-engineer` agent does it end to end.
