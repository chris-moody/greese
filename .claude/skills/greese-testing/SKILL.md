---
name: greese-testing
description: Procedure for testing a new GreeseUI feature or change at every layer - unit (Vitest, axe), e2e (Playwright, five projects), visual regression and Lighthouse - choosing the cheapest layer for each behaviour, writing outcome-based tests that don't flake, and running them. Use when adding or changing a feature that needs tests, when asked to write, fix or review tests, or when a test is flaky.
---

# Testing a GreeseUI feature

Load `greese-conventions` first. The reference for everything below is
[`docs/testing/README.md`](../../../docs/testing/README.md); read it once per
session. `greese-verify` is the gate list for _after_ the tests exist.

## 1. List the behaviours, then pick a layer for each

Write down what the feature must do, one line per behaviour, from the user's
or the consumer's side ("Escape closes the sheet and focus returns to the
trigger"). Then give each line exactly one layer: the cheapest one that can
see it.

| Behaviour                                                                  | Layer                  |
| -------------------------------------------------------------------------- | ---------------------- |
| Role, name, ARIA state, keyboard logic, callbacks, controlled/uncontrolled | Unit                   |
| Classes, `data-*`, inline custom properties rendered (the markup contract) | Unit                   |
| A pure helper                                                              | Unit, called directly  |
| SCSS output, kit, theme                                                    | Unit, Node environment |
| Server Component safety                                                    | Unit, `functionProps`  |
| Size, position, wrapping, breakpoints, computed style                      | e2e                    |
| Real focus, focus trap, `:focus-visible`, top layer, light dismiss         | e2e                    |
| Pointer, touch, drag, hover, scroll                                        | e2e                    |
| How it looks                                                               | Visual (via its story) |
| Page weight and speed                                                      | Lighthouse             |

Don't test one behaviour at two layers: every playground e2e test runs five
times. Before writing a test, search for an existing one
(`grep -rn "<Name>" packages/*/src apps/*/e2e`) and extend it instead.

## 2. Unit tests

- Add a `describe('<Name>')` to the area file in
  `packages/react/src/components/` (`layout`, `forms`, `content`, `overlays`,
  `gaps`, `ported`, `catalogue`, `motion`…), or a new `<area>.test.tsx`.
  Other packages keep tests beside the source (`src/<module>.test.ts`).
- Shape of a component test:

  ```tsx
  it('opens from its trigger, is named by its title, and closes', async () => {
    const onOpenChange = vi.fn()
    const { container } = render(<Thing label="Filters" onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeVisible()
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    await expectNoAxeViolations(container)
  })
  ```

- Use the helpers in `src/test/`: `expectNoAxeViolations`, `setMedia`
  (breakpoints, scheme, reduced motion), the top-layer fakes, and
  `functionProps` for Server Component safety.
- SCSS output: compile with `compileScss()` from `@greese/ui`'s
  `src/test/sass.ts` and read it with `rules(css, selector)`, not regular
  expressions over Sass's whitespace.
- Fake time instead of waiting: `vi.useFakeTimers()`; for greese.js,
  `fakeFrames()` and `restoreFrames()` (`src/test/frames.ts`). A fake
  `IntersectionObserver` is in `src/test/intersection.ts`.
- Restore what you stub (`vi.unstubAllGlobals()`, `vi.restoreAllMocks()`) in
  `afterEach`.

**Run:** `cd packages/react && npx vitest run src/components/<area>.test.tsx`.

## 3. e2e tests (only for what jsdom can't see)

- **Fixture:** add the component to the area's page in
  `apps/playground/src/pages/<Page>.tsx` (new page: register it in
  `src/main.tsx` and add it to `lighthouserc.cjs`). Prefer accessible names;
  add `data-testid` only where nothing names the element.
- **Spec:** `apps/playground/e2e/<area>.spec.ts`, whose `beforeEach` calls
  `openFixture(page, '<name>', (p) => <an element>)`. Use the helpers in
  `e2e/support.ts` (`computed`, `box`, `atLeast`, `isTouch`, `px`, `settled`,
  `shownAcross`, `controlledBy`…) rather than writing your own. Find
  elements by role, then by ARIA relationship, then test id; a part class
  only for `aria-hidden` drawings.
- Shape:

  ```ts
  test('sheet: bottom on phones, side panel from md', async ({ page }) => {
    await page.getByRole('button', { name: 'Open sheet' }).click()
    const sheet = page.getByRole('dialog', { name: 'Filters' })
    await expect(sheet).toBeVisible()
    // Wait for the state, never a time: the slide-in must have finished.
    await expect.poll(async () => (await sheet.boundingBox())!.y).toBe(expectedY)
  })
  ```

- Branch on the project only where behaviour really differs, with
  `test.skip(condition, 'reason')` for what doesn't apply. Touch projects
  have `hasTouch`; use `page.touchscreen` there.
- **Never** `page.waitForTimeout` or a `Date.now()` bound. Use web-first
  assertions, `expect.poll` for transitioning computed styles, or wait for the
  element's animations: `el.getAnimations({ subtree: true })` and each one's
  `finished`.
- Read expected values from `@greese/ui` (`breakpoints`, `space`, `radius`,
  `color`, `typography`), never hard-coded `900` or `8px`.

**Run:** `npm run build`, then in `apps/playground`
`npx playwright test e2e/<area>.spec.ts` (all five projects must pass; debug
one with `--project=webkit` and `--headed`). Site features:
`apps/site/e2e/`, same commands in `apps/site`.

## 4. Visual regression

Every story is captured automatically, so the work is the story itself
(deterministic: no autoplay, randomness or dates) and its baselines:

```bash
npm run build -w docs
cd apps/playground
npx playwright test -c playwright.visual.config.ts --update-snapshots -g "<category>-<name>"
npm run test:visual   # compare, twice
```

**Open the new screenshots**, light and dark, phone and desktop, and look for
stretched, invisible, wrapped or unstyled parts. Delete the baselines of
renamed stories. Only macOS baselines can be recorded locally; say so when
Linux ones need the Visual workflow's `update` run.

## 5. Lighthouse

For a new playground page or anything that changes page weight or the first
render:

```bash
npm run build
npm run lighthouse -w playground   # or -w site for the homepage
```

The budgets are fixed (performance, accessibility and best practices ≥ 0.95;
LCP < 2 s, TBT < 100 ms, CLS < 0.05). Don't change them to get green; find
the cost (`greese-lightweight`).

## 6. Check your tests before calling them done

- [ ] Each behaviour is tested once, at the cheapest layer.
- [ ] Assertions are about outcomes a user or consumer can observe, or the
      public markup contract; no private functions or internal counters.
- [ ] Queries are by role and name first.
- [ ] No sleeps, no wall-clock bounds, no hard-coded token values.
- [ ] `toHaveClass` for classes, not exact `className` strings.
- [ ] Each component test ends with `expectNoAxeViolations`.
- [ ] Every test passes alone and in any order (`npx vitest run -t "<name>"`).
- [ ] New e2e tests pass in all five projects; run a new e2e test three times
      (`--repeat-each=3`) to catch flakes.
- [ ] Shared setup you needed twice is in a helper (`src/test/` for unit
      tests, a support module for e2e), not copied.

## 7. Report

List the tests added or changed per layer, with links; the commands run and
their results, failures and skips included; any layer you skipped and why
(for example "no e2e: nothing here needs layout"); and any baselines that
need recording on Linux.
