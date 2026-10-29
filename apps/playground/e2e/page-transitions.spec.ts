import { expect, test, type Page } from '@playwright/test'

/**
 * Page transitions (ADR 0029) in real engines: React's <ViewTransition>
 * started by usePageNavigate, with greese's effects on the snapshots. Each
 * view transition is recorded as it starts: its types, then (once ready)
 * the animation every snapshot plays.
 */
type Recorded = { types: string[]; played: Array<[string, string]> | null }

declare global {
  interface Window {
    transitions?: Recorded[]
  }
}

const record = (page: Page) =>
  page.addInitScript(() => {
    window.transitions = []
    const start = document.startViewTransition?.bind(document)
    if (!start) return
    document.startViewTransition = ((arg: StartViewTransitionOptions) => {
      const transition = start(arg)
      const entry: Recorded = { types: [...(arg.types ?? [])], played: null }
      window.transitions!.push(entry)
      void transition.ready
        .then(() => {
          entry.played = document
            .getAnimations()
            .filter((a) => (a.effect as KeyframeEffect | null)?.pseudoElement)
            .map((a) => [
              (a.effect as KeyframeEffect).pseudoElement!,
              (a as CSSAnimation).animationName,
            ])
        })
        .catch(() => {})
      return transition
    }) as typeof document.startViewTransition
  })

const open = async (page: Page, path = '/pt/one') => {
  await page.goto(`${path}?page=pages`)
  await page.getByTestId('page').waitFor()
}

const last = (page: Page) =>
  page.evaluate(() => {
    const t = window.transitions!.at(-1)
    return t?.played ? t : null
  })

/** The animations snapshots of `kind` played, by name: `old` or `new`. */
const names = (t: Recorded, kind: 'old' | 'new') =>
  t.played!.filter(([pseudo]) => pseudo.startsWith(`::view-transition-${kind}(`)).map(([, n]) => n)

const supports = (page: Page) =>
  page.evaluate(() => ({
    transitions: 'startViewTransition' in document,
    rules:
      CSS.supports('view-transition-name', 'match-element') &&
      CSS.supports('selector(:active-view-transition-type(x))'),
  }))

test.describe('with view transitions', () => {
  test.beforeEach(async ({ page }) => {
    await record(page)
    await open(page)
    test.skip(!(await supports(page)).transitions, 'no view transitions in this engine')
  })

  test('a link plays the old page out and the new one in, typed by its direction', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Two' }).click()
    await expect(page.getByRole('heading')).toHaveText('/pt/two')
    await expect.poll(() => last(page)).not.toBeNull()
    const t = (await last(page))!
    expect(t.types).toEqual(['greese-page', 'greese-forward', 'greese-sibling'])
    // The old page scales out (its own exit); the new one follows the theme.
    expect(names(t, 'old')).toContain('greese-scale-out')
    expect(names(t, 'new')).toContain('greese-fade-in')
    // The hero leaves on its own, where the engine names parts of a page.
    if ((await supports(page)).rules) expect(names(t, 'old')).toContain('greese-fade-out')
  })

  test('going up the URL is back: the back entrance plays', async ({ page }) => {
    await page.getByRole('link', { name: 'Deeper' }).click()
    await expect(page.getByRole('heading')).toHaveText('/pt/two/deeper')
    await page.getByRole('link', { name: 'Two' }).click()
    await expect(page.getByRole('heading')).toHaveText('/pt/two')
    await expect
      .poll(async () => (await last(page))?.types)
      .toEqual(['greese-page', 'greese-back', 'greese-shallower'])
    expect(names((await last(page))!, 'new')).toContain('greese-slide-right')
  })

  test('a link to the page it is on changes nothing', async ({ page }) => {
    const count = () => page.evaluate(() => window.transitions!.length)
    const before = await count()
    await page.getByRole('link', { name: 'One' }).click()
    await expect(page.getByRole('heading')).toHaveText('/pt/one')
    expect(await count()).toBe(before)
  })
})

test('under reduced motion, greese snapshots do not animate', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await record(page)
  await open(page)
  test.skip(!(await supports(page)).transitions, 'no view transitions in this engine')
  await page.getByRole('link', { name: 'Two' }).click()
  await expect(page.getByRole('heading')).toHaveText('/pt/two')
  await expect.poll(() => last(page)).not.toBeNull()
  const greese = (await last(page))!.played!.filter(([, n]) => n?.startsWith('greese-'))
  expect(greese).toEqual([])
  await context.close()
})

test('without view transitions the page simply changes', async ({ page }) => {
  await page.addInitScript(() => {
    delete (Document.prototype as { startViewTransition?: unknown }).startViewTransition
  })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await open(page)
  await page.getByRole('link', { name: 'Deeper' }).click()
  await expect(page.getByRole('heading')).toHaveText('/pt/two/deeper')
  await expect(page).toHaveURL(/\/pt\/two\/deeper\?page=pages$/)
  expect(errors).toEqual([])
})
