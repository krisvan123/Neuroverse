import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { expect, test } from '@playwright/test'

test('immersive homepage is informative, interactive, and accessible', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => { errors.push(error.message) })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /the universe inside every connection/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /start your discovery/i })).toBeVisible()
  await expect(page.getByText(/fafb-aligned neuropil surface · original published mesh/i)).toBeVisible()

  const method = page.locator('details.visualization-disclosure')
  await method.locator('summary').click()
  await expect(method.getByText(/not a live brain scan/i)).toBeVisible()

  const quality = page.getByLabel('Quality')
  if (await quality.isEnabled()) {
    await quality.selectOption('saver')
    await expect(quality).toHaveValue('saver')
    await expect(page.getByRole('button', { name: 'Neuropil', exact: true })).toHaveAttribute('aria-pressed', 'true')
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
  // The previous test emulates reduced motion. Explicitly request an animated
  // scene so demand-rendering is not incorrectly evaluated as zero FPS.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  if (await page.getByRole('button', { name: 'Resume motion' }).isVisible()) {
    await page.getByRole('button', { name: 'Resume motion' }).click()
  }
  if (!(await page.getByLabel('Quality').isEnabled())) {
    test.skip(true, 'No WebGL exposed by Chromium fixture — visual fallback was tested separately')
  }
  await expect(page.getByText('INTERACTIVE / 3D VIEWER')).toBeVisible({ timeout: 20_000 })

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
  console.log('Browser rAF scheduling baseline:', measurement)
  // Headless scheduling changes under parallel GPU/CPU load. The rAF count is
  // observational; actual scene-frame and draw-call assertions are below.
  expect(measurement.frames).toBeGreaterThan(0)

  // Unlike rAF alone, this is recorded from R3F useFrame and Three renderer info.
  await expect.poll(
    () => page.evaluate(() => (window as Window & {
      __neuroverseSceneDiagnostics?: { sampledSceneFrames: number }
    }).__neuroverseSceneDiagnostics?.sampledSceneFrames ?? 0),
    { timeout: 20_000 },
  ).toBeGreaterThan(10)
  const renderer = await page.evaluate(() => (window as Window & {
    __neuroverseSceneDiagnostics?: {
      sampledSceneFrames: number
      medianSceneFrameMs: number
      rendererDrawCalls: number
      note: string
    }
  }).__neuroverseSceneDiagnostics)
  expect(renderer?.rendererDrawCalls).toBeGreaterThan(0)
  console.log('Three.js scene-render baseline (not physical GPU FPS):', renderer)
})


test('published original FAFB tissue surface renders in the actual 3D homepage', async ({ page }, testInfo) => {
  const sourceFile = process.env.NEUROVERSE_REAL_PLY_FILE
  test.skip(!sourceFile, 'Real published PLY is staged only in authenticated GitHub CI')
  const raw = await readFile(sourceFile!)
  const sha256 = createHash('sha256').update(raw).digest('hex')
  await page.route('**/api/v1/brain/tissue-mesh', async (route) => {
    await route.fulfill({
      status: 200,
      body: raw,
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Neuroverse-Source-SHA256': sha256,
      },
    })
  })
  await page.goto('/')
  const hero = page.locator('.brain-stage')
  await page.getByRole('button', { name: 'Whole tissue', exact: true }).click()
  if (!(await page.getByLabel('Quality').isEnabled())) {
    test.skip(true, 'No WebGL in Chromium; original source mesh test requires WebGL')
  }
  await expect(hero.getByText('INTERACTIVE / VERIFIED FAFB 3D')).toBeVisible({ timeout: 30000 })
  await expect(hero.getByText(/fafb whole-brain tissue surface · original published mesh/i)).toBeVisible()
  const canvas = hero.locator('canvas')
  await expect(canvas).toBeVisible()
  await page.getByRole('button', { name: 'Left view' }).click()
  await expect(page.getByRole('button', { name: 'Left view' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Front view' }).click()
  await page.waitForTimeout(800)
  await hero.screenshot({ path: testInfo.outputPath('authentic-FAFB-3D-tissue-hero.png'), animations: 'disabled' })
})


test('site-wide stars animate at every scroll position and honor reduced motion toggle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const background = page.locator('.cosmic-backdrop')
  const stars = background.locator('.layer-one')
  await expect(background).toBeVisible()
  const motion = await stars.evaluate(element => ({
    name: getComputedStyle(element).animationName,
    position: getComputedStyle(element.parentElement!).position,
  }))
  expect(motion.name).toContain('nv-stars-near')
  expect(motion.position).toBe('fixed')
  // Mere presence of CSS animations was not visually noticeable: assert
  // computed motion actually shifts stars by >= 9px in under 1.4 seconds.
  const initial = await stars.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)
  await page.waitForTimeout(1300)
  const later = await stars.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)
  expect(Math.abs(later - initial)).toBeGreaterThan(9)
  await page.locator('#sources').scrollIntoViewIfNeeded()
  await expect(background).toBeVisible()
  await page.getByRole('button', { name: 'Reduce ambient motion' }).click()
  await expect.poll(() => stars.evaluate(element => getComputedStyle(element).animationName)).toBe('none')
  await page.getByRole('button', { name: 'Enable ambient motion' }).click()
  await expect.poll(() => stars.evaluate(element => getComputedStyle(element).animationName)).toContain('nv-stars-near')
})


test('published original FAFB-aligned neuropil is the anatomical hero default', async ({ page }, testInfo) => {
  const sourceFile = process.env.NEUROVERSE_REAL_NEUROPIL_PLY_FILE
  test.skip(!sourceFile, 'Real published neuropil is staged in GitHub Actions')
  const raw = await readFile(sourceFile!)
  const sha256 = createHash('sha256').update(raw).digest('hex')
  await page.route('**/api/v1/brain/neuropil-mesh', async route => {
    await route.fulfill({
      status: 200,
      body: raw,
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Neuroverse-Source-SHA256': sha256,
      },
    })
  })
  await page.goto('/')
  const hero = page.locator('.brain-stage')
  if (!(await page.getByLabel('Quality').isEnabled())) {
    test.skip(true, 'No WebGL; genuine neuropil requires a GPU/software WebGL')
  }
  await expect(page.getByRole('button', { name: 'Neuropil', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(hero.getByText('INTERACTIVE / VERIFIED FAFB 3D')).toBeVisible({ timeout: 30000 })
  await expect(hero.getByText(/fafb-aligned neuropil surface · original published mesh/i)).toBeVisible()
  await page.getByRole('button', { name: 'Depth', exact: true }).click()
  await expect(page.getByText(/depth colors encode source-mesh coordinates/i)).toBeVisible()
  await page.getByRole('button', { name: 'Wireframe', exact: true }).click()
  await expect(page.getByText(/published mesh triangles, not neurons/i)).toBeVisible()
  await page.getByRole('button', { name: 'Anatomy', exact: true }).click()
  await hero.screenshot({
    path: testInfo.outputPath('phase05-2-authentic-FAFB-neuropil-homepage.png'),
    animations: 'disabled',
  })
})

test('DNA helix and source controls remain usable with motion paused and no WebGL', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const source = page.getByRole('group', { name: 'Original fly-brain anatomical source' })
  await expect(source.getByRole('button', { name: 'Neuropil' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Resume motion' })).toBeVisible()
  const styles = await page.locator('.cosmic-backdrop .layer-one').evaluate(el => getComputedStyle(el).animationName)
  expect(styles).toBe('none')
  if (await page.getByLabel('Quality').isEnabled()) {
    await source.getByRole('button', { name: 'Whole tissue' }).click()
    await expect(source.getByRole('button', { name: 'Whole tissue' })).toHaveAttribute('aria-pressed', 'true')
  } else {
    await expect(source.getByRole('button', { name: 'Neuropil' })).toBeDisabled()
  }
})
