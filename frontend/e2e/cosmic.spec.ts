import { expect, test } from '@playwright/test'

test('immersive homepage is informative, interactive, and accessible', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => { errors.push(error.message) })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /the universe inside every connection/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /start your discovery/i })).toBeVisible()
  await expect(page.getByText(/procedural concept art · not flywire morphology/i)).toBeVisible()

  const method = page.locator('details.visualization-disclosure')
  await method.locator('summary').click()
  await expect(method.getByText(/not reconstructed FlyWire neurons/i)).toBeVisible()

  const quality = page.getByLabel('Quality')
  if (await quality.isEnabled()) {
    await quality.selectOption('saver')
    await expect(quality).toHaveValue('saver')
    await page.getByRole('button', { name: 'Left view' }).click()
    await expect(page.getByRole('button', { name: 'Left view' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Front view' })).toHaveAttribute('aria-pressed', 'true')
  } else {
    await expect(page.getByText(/WebGL unavailable/i)).toBeVisible()
  }

  await page.getByRole('button', { name: 'Pause motion' }).click()
  await expect(page.getByRole('button', { name: 'Resume motion' })).toBeVisible()
  await page.getByRole('button', { name: 'Resume motion' }).click()
  await expect(page.getByRole('button', { name: 'Pause motion' })).toBeVisible()

  // Distinguish layout work from GPU benchmarks: responsive reflow must be testable.
  const overflow = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }))
  expect(overflow.pageWidth).toBeLessThanOrEqual(overflow.viewportWidth + 2)

  // Restore Balanced to capture the intended DNA/particle ambience rather than Saver.
  if (await quality.isEnabled()) await quality.selectOption('balanced')
  await method.locator('summary').click()
  await page.locator('.brain-stage').screenshot({
    path: testInfo.outputPath('brain-detail-phase04.png'),
    animations: 'disabled',
  })
  // Full-page mobile screenshots can stitch repeated GPU tiles in headless Chromium.
  // Keep an actual mobile viewport capture and a separate canvas close-up instead.
  await page.screenshot({
    path: testInfo.outputPath('homepage-phase04.png'),
    fullPage: testInfo.project.name === 'desktop-chromium',
    animations: 'disabled',
  })
  expect(errors).toEqual([])
})

test('keyboard-only navigation and WebGL-disabled fallback remain usable', async ({ page }) => {
  await page.addInitScript(() => {
    const existing = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl') return null
      return existing.call(this, type, ...args)
    } as typeof HTMLCanvasElement.prototype.getContext
  })

  await page.goto('/')
  await expect(page.getByText(/static visualization — webgl unavailable/i)).toBeVisible()
  await expect(page.getByRole('img', { name: /conceptual illustrated bilateral fruit fly brain/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Top view' })).toBeDisabled()
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#main$/)
  await expect(page.getByRole('link', { name: /start your discovery/i })).toBeVisible()
})

test('reduced-motion preference starts with animation paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Resume motion' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe('quiet')
})

test('3D drawing performance records a software-rendered baseline', async ({ page }) => {
  await page.goto('/')
  if (!(await page.getByLabel('Quality').isEnabled())) {
    test.skip(true, 'No WebGL exposed by Chromium fixture — visual fallback was tested separately')
  }
  await expect(page.getByText('INTERACTIVE / 3D CONCEPT')).toBeVisible({ timeout: 20_000 })

  const measurement = await page.evaluate(async () => {
    const samples: number[] = []
    return await new Promise<{ frames: number; medianFrameMs: number }>((resolve) => {
      let previous = 0
      let began = 0
      const track = (now: number) => {
        if (!began) began = now
        if (previous) samples.push(now - previous)
        previous = now
        if (now - began < 1500) requestAnimationFrame(track)
        else {
          samples.sort((a, b) => a - b)
          resolve({ frames: samples.length, medianFrameMs: samples[Math.floor(samples.length / 2)] ?? 0 })
        }
      }
      requestAnimationFrame(track)
    })
  })
  console.log('Browser rAF scheduling baseline (not measured 3D FPS):', measurement)
  expect(measurement.frames).toBeGreaterThan(10)
})
