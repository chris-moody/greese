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
  t
    .played!.filter(([pseudo]) => pseudo.startsWith(`::view-transition-${kind}(`))
    .map(([, n]) => n)

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

/** Milliseconds from the next click on a link to the heading changing (the commit). */
const timeCommit = (page: Page) =>
  page.evaluate(() => {
    const w = window as Window & { clickAt?: number; committedAt?: number }
    addEventListener('click', () => (w.clickAt = performance.now()), {
      capture: true,
      once: true,
    })
    new MutationObserver((_, observer) => {
      w.committedAt = performance.now()
      observer.disconnect()
    }).observe(document.querySelector('h1')!, {
      childList: true,
      characterData: true,
      subtree: true,
    })
  })
const commitDelay = (page: Page) =>
  page.evaluate(() => {
    const w = window as Window & { clickAt?: number; committedAt?: number }
    return w.committedAt! - w.clickAt!
  })

test.describe('live exits', () => {
  test('members leave in reverse order on the real page, before the new page commits', async ({
    page,
  }) => {
    await page.goto('/pt/one?page=pages&variant=live')
    await page.getByTestId('member-b').waitFor()
    // Let the members' entrances finish first.
    await page.waitForTimeout(700)
    await timeCommit(page)
    await page.getByRole('link', { name: 'Two' }).click()
    // The old page is still there, its members leaving: the last first.
    await expect(page.getByRole('heading')).toHaveText('/pt/one')
    const animation = (id: string) =>
      page.getByTestId(id).evaluate((el) => (el as HTMLElement).style.animation)
    expect(await animation('member-b')).toMatch(/greese-fade-out.*calc\(0 \* 0\.1s\)/)
    expect(await animation('member-a')).toMatch(/greese-fade-out.*calc\(1 \* 0\.1s\)/)
    await expect(page.getByRole('heading')).toHaveText('/pt/two')
    // 0.6 s each, the second 0.1 s later: the commit waited for both.
    expect(await commitDelay(page)).toBeGreaterThanOrEqual(650)
    // The new page's members (React kept the same elements) arrive again,
    // rather than keeping the exit's last frame.
    for (const id of ['member-a', 'member-b']) {
      await expect.poll(() => animation(id)).toBe('')
      await expect
        .poll(() =>
          page.getByTestId(id).evaluate((el) => Number(getComputedStyle(el).opacity))
        )
        .toBe(1)
    }
  })

  test('a timeline map plays its sequences together on their own targets, then commits', async ({
    page,
  }) => {
    await page.goto('/pt/one?page=pages&variant=timeline')
    await page.getByTestId('member-b').waitFor()
    await page.waitForTimeout(700)
    await timeCommit(page)
    await page.getByRole('link', { name: 'Two' }).click()
    // greese.js writes the real elements: member-a fades while member-b scales.
    await expect
      .poll(() =>
        page
          .getByTestId('member-a')
          .evaluate((el) => Number(getComputedStyle(el).opacity))
      )
      .toBeLessThan(1)
    await expect
      .poll(() =>
        page.getByTestId('member-b').evaluate((el) => getComputedStyle(el).scale)
      )
      .not.toBe('none')
    await expect(page.getByRole('heading')).toHaveText('/pt/two')
    // member-b's sequence is the longest: 0.2 + 0.2 + 0.2 s.
    expect(await commitDelay(page)).toBeGreaterThanOrEqual(550)
    // greese.js puts the elements back once the new page is in.
    await expect
      .poll(() =>
        page.getByTestId('member-a').evaluate((el) => Number(getComputedStyle(el).opacity))
      )
      .toBe(1)
  })

  test('back is held while the live page leaves, where the browser can hold it', async ({
    page,
  }) => {
    await page.goto('/pt/one?page=pages&variant=live')
    await page.getByTestId('member-b').waitFor()
    await page.waitForTimeout(700)
    await page.getByRole('link', { name: 'Two' }).click()
    await expect(page.getByRole('heading')).toHaveText('/pt/two')
    await page.waitForTimeout(800)
    const holds = await page.evaluate(
      () => 'navigation' in window && 'NavigationPrecommitController' in window
    )
    await timeCommit(page)
    await page.evaluate(() => {
      ;(window as Window & { clickAt?: number }).clickAt = performance.now()
      history.back()
    })
    await expect(page.getByRole('heading')).toHaveText('/pt/one')
    const delay = await commitDelay(page)
    if (holds) expect(delay).toBeGreaterThanOrEqual(650)
    else expect(delay).toBeLessThan(400)
  })

  test('under reduced motion a live page changes at once', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/pt/one?page=pages&variant=live')
    await page.getByTestId('member-b').waitFor()
    await timeCommit(page)
    await page.getByRole('link', { name: 'Two' }).click()
    await expect(page.getByRole('heading')).toHaveText('/pt/two')
    expect(await commitDelay(page)).toBeLessThan(400)
    await context.close()
  })
})
