import { expect, test } from '@playwright/test'

test('release navigation points to real accessible sections', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  const missing = await page.locator('a[href^="#"]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('href') ?? '')
      .filter((href) => href.length > 1 && !document.getElementById(href.slice(1))))
  expect(missing).toEqual([])
  await page.getByRole('link', { name: 'Journal', exact: true }).click()
  await expect(page).toHaveURL(/#journal$/)
  await expect(page.getByRole('heading', { name: /research journal/i })).toBeVisible()
})

test('source links use safe new-tab attributes and disclaimers remain visible', async ({ page }) => {
  await page.goto('/')
  const unprotected = await page.locator('a[target="_blank"]').evaluateAll((elements) =>
    elements.filter((element) => !element.relList.contains('noopener') ||
      !element.relList.contains('noreferrer')).map((element) => element.getAttribute('href')))
  expect(unprotected).toEqual([])
  await page.locator('#sources').scrollIntoViewIfNeeded()
  await expect(page.getByRole('link', { name: /data licenses & attribution/i })).toBeVisible()
  await expect(page.getByText(/independent, research-inspired science education/i)).toBeVisible()
})
