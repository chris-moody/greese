import { expect, test, type Page } from '@playwright/test'

/**
 * The site's page transitions (ADR 0029): every route change goes through
 * PageTransition, typed by its direction. Each view transition is recorded
 * as it starts: its types, then (once it's finished) the pseudo-elements it
 * animated, as their animations started. Not `getAnimations()` at `ready`:
 * on a busy machine that runs late, after the short ones have finished and
 * gone.
 */
type Recorded = { types: string[]; played: string[] | null }

const record = (page: Page) =>
  page.addInitScript(() => {
    const w = window as Window & { transitions?: Recorded[] }
    w.transitions = []
    const start = document.startViewTransition?.bind(document)
    if (!start) return
    let started: string[] | null = null
    document.addEventListener(
      'animationstart',
      (e) => {
        if (e.pseudoElement.startsWith('::view-transition'))
          started?.push(`${e.pseudoElement} ${e.animationName}`)
      },
      true
    )
    document.startViewTransition = ((arg: StartViewTransitionOptions) => {
      const transition = start(arg)
      const entry: Recorded = { types: [...(arg.types ?? [])], played: null }
      w.transitions!.push(entry)
      const seen: string[] = []
      started = seen
      void transition.finished.then(() => (entry.played = seen)).catch(() => {})
      return transition
    }) as typeof document.startViewTransition
  })

/** The last page change's view transition, once it's ready. */
const last = (page: Page) =>
  page.evaluate(() => {
    const t = (window as Window & { transitions?: Recorded[] })
      .transitions!.filter((e) => e.types.includes('greese-page'))
      .at(-1)
    return t?.played ? t : null
  })

const count = (page: Page) =>
  page.evaluate(
    () => (window as Window & { transitions?: Recorded[] }).transitions!.length
  )

test.beforeEach(({ page }) => record(page))

/**
 * A page that has finished loading: its chunks, content and footer in. A
 * page change started while the page is still settling, within a few frames
 * of its content arriving, can commit without a view transition: on the dev
 * server, under load, a click comes that soon.
 */
const settled = (page: Page) => page.waitForLoadState('networkidle')

test('leaving the homepage leaves live: its members go, the last first, then the page changes', async ({
  page,
}) => {
  await page.goto('/')
  await page.locator('.greese-Header').waitFor()
  // The homepage's entrances, settled.
  await page.waitForTimeout(1500)
  const before = await count(page)
  // Counts exits taken off while the homepage is still there: a member that
  // flashes back in before the next page commits.
  await page.evaluate(() => {
    const w = window as Window & { early?: number }
    w.early = 0
    new MutationObserver((records) => {
      for (const r of records)
        if (
          r.oldValue?.includes('greese-motion-page-exit') &&
          !(r.target as HTMLElement).style.animation &&
          document.querySelector('.site--home')
        )
          w.early!++
    }).observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
      attributeOldValue: true,
    })
  })
  await page.locator('.site-nav-links').getByRole('link', { name: 'Templates' }).click()
  // The hero's members play their exits on the real page.
  const exits = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        'main ~ * .greese-Motion--enter, .greese-Motion--enter'
      ),
    ]
      .map((el) => el.style.animation)
      .filter((a) => a.includes('greese-motion-page-exit'))
  )
  expect(exits.length).toBeGreaterThan(0)
  await expect(page).toHaveURL(/\/templates$/)
  await expect(page.locator('#main a[href$="/templates/finance"]')).toBeVisible()
  // They stayed gone until the commit.
  expect(await page.evaluate(() => (window as Window & { early?: number }).early)).toBe(0)
  // Then the new page arrives as a snapshot, and what the exit left fades.
  await expect.poll(() => count(page)).toBeGreaterThan(before)
  await expect.poll(() => last(page)).not.toBeNull()
  const live = (await last(page))!
  expect(live.types).toEqual(expect.arrayContaining(['greese-forward', 'greese-live']))
  expect(live.played!.join('\n')).toMatch(/::view-transition-old\(.*\) greese-fade-out/)
})

test('a template card morphs into its page’s title, going deeper; its bar goes back', async ({
  page,
}) => {
  await page.goto('/templates')
  const card = page.locator('#main a[href$="/templates/finance"]')
  await card.waitFor()
  await settled(page)
  await card.click()
  await expect(page).toHaveURL(/\/templates\/finance$/)
  await expect.poll(() => last(page)).not.toBeNull()
  const forward = (await last(page))!
  expect(forward.types).toEqual(
    expect.arrayContaining(['greese-page', 'greese-forward', 'greese-deeper'])
  )
  expect(forward.played!.join('\n')).toContain(
    '::view-transition-group(greese-share-template-finance)'
  )

  const before = await count(page)
  await page.locator('.tpl-bar').getByRole('link', { name: 'Templates' }).click()
  await expect(page).toHaveURL(/\/templates$/)
  await expect.poll(() => count(page)).toBeGreaterThan(before)
  await expect
    .poll(async () => (await last(page))?.types)
    .toEqual(expect.arrayContaining(['greese-back', 'greese-shallower']))
})

test('one docs page to the next is a sibling', async ({ page }) => {
  await page.goto('/docs/forms-button')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Button')
  await settled(page)
  await page.locator('a[rel="next"]').click()
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Button')
  await expect
    .poll(async () => (await last(page))?.types)
    .toEqual(expect.arrayContaining(['greese-page', 'greese-forward', 'greese-sibling']))
})

test('a studio tab changes in place', async ({ page }) => {
  await page.goto('/studio')
  await page.getByRole('tab', { name: 'Tokens' }).waitFor()
  const before = await page.evaluate(
    () =>
      (window as Window & { transitions?: Recorded[] }).transitions!.filter((t) =>
        t.types.includes('greese-page')
      ).length
  )
  await page.getByRole('tab', { name: 'Motion' }).click()
  await expect(page).toHaveURL(/\?tab=motion$/)
  await page.waitForTimeout(300)
  expect(
    await page.evaluate(
      () =>
        (window as Window & { transitions?: Recorded[] }).transitions!.filter((t) =>
          t.types.includes('greese-page')
        ).length
    )
  ).toBe(before)
})
