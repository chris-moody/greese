import { expect, test } from '@playwright/test'

/**
 * Form controls in real engines: keyboard behaviour comes from the native
 * elements, so this checks we kept it while restyling them.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/?page=forms')
  await page.getByRole('form', { name: 'Profile' }).waitFor()
})

const isTouch = (projectName: string) => ['mobile', 'iphone'].includes(projectName)

test('keyboard: Space toggles checkboxes and switches, arrows move radios', async ({
  page,
}) => {
  const sms = page.getByRole('checkbox', { name: 'SMS' })
  await sms.focus()
  await page.keyboard.press('Space')
  await expect(sms).toBeChecked()

  const beta = page.getByRole('switch', { name: 'Beta features' })
  await beta.focus()
  await page.keyboard.press('Space')
  await expect(beta).toBeChecked()

  await page.getByRole('radio', { name: 'Free' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Pro' })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Pro' })).toBeFocused()

  const bold = page.getByRole('button', { name: 'Bold' })
  await bold.focus()
  await page.keyboard.press('Enter')
  await expect(bold).toHaveAttribute('aria-pressed', 'true')
})

test('keyboard: arrows move the slider and its filled track', async ({ page }) => {
  const slider = page.getByRole('slider', { name: 'Volume' })
  await slider.focus()
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveValue('55')
  expect(
    await slider.evaluate((el) => el.style.getPropertyValue('--greese-slider-fill'))
  ).toBe('55%')
})

test('keyboard focus shows the focus ring', async ({ page }) => {
  const email = page.getByRole('checkbox', { name: 'Email' })
  // A key press, then focus: every engine then treats focus as keyboard focus.
  // (Tab alone won't do: Safari skips checkboxes without Full Keyboard Access.)
  await page.keyboard.press('Shift')
  await email.focus()
  expect(await email.evaluate((el) => el.matches(':focus-visible'))).toBe(true)
  expect(await email.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid')
})

test('submitting sends exactly the values on screen', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Name' }).fill('Grace')
  await page.getByRole('textbox', { name: 'Bio' }).fill('Compilers')
  await page.getByLabel('Country').selectOption('au')
  await page.getByText('SMS').click()
  await page.getByText('Team').click()
  await page.getByText('Beta features').click()
  await page.getByRole('button', { name: 'Save' }).click()

  const result = JSON.parse((await page.getByTestId('result').textContent())!)
  expect(result).toMatchObject({
    name: 'Grace',
    bio: 'Compilers',
    country: 'au',
    notify: ['email', 'sms'],
    plan: 'team',
    beta: 'on',
    volume: '50',
  })
})

test('the textarea grows with its content where field-sizing is supported', async ({
  page,
}) => {
  const bio = page.getByRole('textbox', { name: 'Bio' })
  const before = (await bio.boundingBox())!.height
  await bio.fill('one\ntwo\nthree\nfour\nfive\nsix\nseven')
  const supported = await page.evaluate(() => CSS.supports('field-sizing', 'content'))
  const after = (await bio.boundingBox())!.height
  if (supported) expect(after).toBeGreaterThan(before)
  else expect(after).toBe(before)
})

test('touch: inputs never trigger iOS zoom and targets are finger-sized', async ({
  page,
}, testInfo) => {
  test.skip(!isTouch(testInfo.project.name), 'touch devices only')

  // Even the small input renders text at 16px or more on touch screens.
  for (const name of ['Name', 'Small input', 'Bio']) {
    const size = await page
      .getByRole('textbox', { name })
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(size, name).toBeGreaterThanOrEqual(16)
  }

  // Small controls keep their look but get a 44px hit area.
  const hitArea = (el: Element) => {
    const after = getComputedStyle(el, '::after')
    return Math.min(parseFloat(after.width), parseFloat(after.height))
  }
  for (const locator of [
    page.getByRole('button', { name: 'Add item' }),
    page.getByRole('button', { name: 'Small button' }),
    page.getByRole('checkbox', { name: 'Email' }),
    page.getByRole('radio', { name: 'Free' }),
  ]) {
    expect(await locator.evaluate(hitArea)).toBeGreaterThanOrEqual(44)
  }
})
