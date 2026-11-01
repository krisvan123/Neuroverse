import { expect, test, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'

// Synthetic fixtures exercise interaction only; shipped data come from the pinned source.
const rid = '720575940625431866', other = '720575940625448968', third = '720575940600000003'
const neurons = [rid, other, third].map((id, i) => ({
  root_id: id, label: i === 0 ? 'Test ALPN' : `Test neuron ${i}`, cell_class: i === 0 ? 'ALPN' : null,
  cell_type: null, hemibrain_type: null, super_class: 'central', side: 'left',
  position_nm: [0, 0, 100000], position_kind: 'soma', top_nt: i === 0 ? 'acetylcholine' : null,
  top_nt_conf: i === 0 ? '0.9' : null, known_nt: null, known_nt_source: null, status: null,
}))
function skeleton(id: string) {
  return { root_id: id, snapshot: '783', units: 'nanometer', geometry_type: 'precomputed_neuron_skeleton_centerlines',
    coordinate_space: 'FlyWire FAFB v783 precomputed skeleton coordinate frame',
    source_url: 'https://flyem.mrc-lmb.cam.ac.uk/flyconnectome/flywire_skeletons_783/' + id,
    source_reference: 'https://doi.org/10.1038/s41586-024-07686-5', source_sha256: 'a'.repeat(64),
    vertex_count: 3, edge_count: 2, vertices: [[0, 0, 0], [100, 200, 40], [250, 100, 80]], edges: [[0, 1], [1, 2]], limitations: ['Synthetic browser-test geometry only'] }
}
async function stage(page: Page, failSkeleton = false, delayFirst = false) {
  const points = [[rid, 0, 0, 100000, 0], [other, -100000, 100000, 0, 1], [third, 100000, -100000, 0, 0]] as const
  const binary = Buffer.alloc(12 + points.length * 21)
  binary.write('NVAP'); binary.writeUInt32LE(1, 4); binary.writeUInt32LE(points.length, 8)
  points.forEach((point, i) => {
    const at = 12 + i * 21
    binary.writeBigUInt64LE(BigInt(point[0]), at)
    binary.writeFloatLE(point[1], at + 8); binary.writeFloatLE(point[2], at + 12); binary.writeFloatLE(point[3], at + 16); binary.writeUInt8(point[4], at + 20)
  })
  const sha = createHash('sha256').update(binary).digest('hex')
  await page.route('**/data/fafb-v783-atlas.json', route => route.fulfill({ json: {
    snapshot: '783', annotation_release: '2.1.0', units: 'nanometer', total_neurons: 3,
    soma_count: 2, unpositioned_count: 0, point_count: 3, format_version: 1,
    file: `fafb-v783-${sha.slice(0, 16)}.bin`, asset_sha256: sha, asset_bytes: binary.length,
    source_reference: 'https://doi.org/10.1038/s41586-024-07686-5', source_sha256: 'a'.repeat(64),
  } }))
  await page.route('**/data/fafb-v783-*.bin', route => route.fulfill({ contentType: 'application/octet-stream', body: binary }))
  await page.route('**/api/v1/atlas/search?**', route => {
    const query = new URL(route.request().url()).searchParams.get('q') || ''
    const results = neurons.filter(n => n.label.includes(query) || n.root_id.includes(query))
    return route.fulfill({ json: { results, total: results.length, offset: 0 } })
  })
  await page.route('**/api/v1/atlas/neurons/*', async route => {
    const id = route.request().url().split('/').pop()!
    if (delayFirst && id === rid) await new Promise(resolve => setTimeout(resolve, 700))
    const row = neurons.find(n => n.root_id === id)!
    await route.fulfill({ json: { ...row, snapshot: '783', annotation_release: '2.1.0',
      source_reference: 'https://doi.org/10.1038/s41586-024-07686-5', source_url: 'https://raw.githubusercontent.com/test', source_sha256: 'a'.repeat(64),
      codex_url: 'https://codex.flywire.ai/app/cell_details?cell_names_or_id=' + id,
      function: { evidence: id === rid ? 'cell_class_context' : 'not_established',
        title: id === rid ? 'Olfactory relay' : 'Individual function not established here',
        summary: 'Class-level test description.', limitation: 'Not a measurement of this cell’s activity.',
        source_reference: 'https://doi.org/10.1038/s41586-024-07686-5' },
    } }).catch(() => {}) // An aborted superseded request is expected in the race test.
  })
  await page.route('**/api/v1/neurons/*/skeleton', route => {
    const id = route.request().url().split('/').at(-2)!
    return route.fulfill(failSkeleton ? { status: 503, json: { detail: 'Scientific skeleton source unavailable' } } : { json: skeleton(id) })
  })
  await page.goto('/#explore')
  await expect(page.getByText('3 mapped cells', { exact: true })).toBeVisible()
}

test('a mapped cell opens through the 3D canvas with a focus animation and back navigation', async ({ page }) => {
  await stage(page)
  const atlas = page.locator('#explore')
  const canvas = atlas.locator('canvas')
  await expect(canvas).toBeVisible()
  await expect(atlas.locator('.cells-viewport')).toHaveAttribute('data-map-ready', 'true')
  await atlas.getByRole('button', { name: 'Pause rotation' }).click()
  await atlas.getByRole('button', { name: 'Front', exact: true }).click()
  await page.waitForTimeout(700) // Wait for the 650ms camera preset transition.
  // Observe before the click: rendering on a software GPU can outlast the
  // transition before Playwright's click promise returns.
  await atlas.locator('.cells-viewport').evaluate(element => {
    const states: string[] = []
    const observer = new MutationObserver(() => {
      states.push(element.getAttribute('data-transition') || '')
      element.setAttribute('data-observed-transitions', states.join(','))
      if (states.includes('focusing') && states.at(-1) === 'idle') observer.disconnect()
    })
    observer.observe(element, { attributes: true, attributeFilter: ['data-transition'] })
  })
  // Center point is the first neuron in the known test coordinate frame.
  await canvas.click({ position: { x: (await canvas.boundingBox())!.width / 2, y: (await canvas.boundingBox())!.height / 2 } })
  await expect(atlas.locator('.cells-viewport')).toHaveAttribute('data-observed-transitions', 'focusing,idle')
  await expect(atlas.getByRole('heading', { name: 'Test ALPN' })).toBeVisible()
  await expect(atlas.getByText(/3 recorded vertices · 2 branch segments/)).toBeVisible()
  await expect(atlas.getByText('CELL-CLASS CONTEXT', { exact: true })).toBeVisible()
  await expect(atlas.locator('.cells-viewport')).toHaveAttribute('data-transition', 'idle')
  await atlas.getByRole('button', { name: 'Whole brain', exact: false }).click()
  await expect(atlas.getByText('3 mapped cells', { exact: true })).toBeVisible()
})

test('the overview rotates, pauses on demand and stops rendering offscreen', async ({ page }) => {
  await stage(page)
  const atlas = page.locator('#explore')
  const shell = atlas.locator('.connectome-shell')
  const canvas = atlas.locator('canvas')
  await expect(atlas.locator('.cells-viewport')).toHaveAttribute('data-map-ready', 'true')
  await expect(atlas.getByText('3 original reconstructions loaded')).toBeVisible()
  await expect(shell).toHaveAttribute('data-render-state', 'rotating')
  const first = await canvas.screenshot()
  await page.waitForTimeout(600)
  expect((await canvas.screenshot()).equals(first)).toBe(false)
  await atlas.getByRole('button', { name: 'Pause rotation' }).click()
  await expect(shell).toHaveAttribute('data-render-state', 'paused')
  const stopped = await canvas.screenshot()
  await page.waitForTimeout(200)
  expect((await canvas.screenshot()).equals(stopped)).toBe(true)
  await atlas.getByRole('button', { name: 'Rotate brain' }).click()
  await expect(shell).toHaveAttribute('data-render-state', 'rotating')
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(shell).toHaveAttribute('data-render-state', 'paused')
  await shell.scrollIntoViewIfNeeded()
  await expect(shell).toHaveAttribute('data-render-state', 'rotating')
})

test('keyboard selection, reduced motion and source failure preserve the actual identity', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await stage(page, true)
  const atlas = page.locator('#explore')
  await atlas.getByRole('button', { name: 'Find a neuron' }).click()
  const button = atlas.getByRole('button', { name: `Inspect Test ALPN, neuron ${rid}` })
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(atlas.locator('.cells-viewport')).toHaveAttribute('data-transition', 'idle')
  await expect(atlas.getByRole('heading', { name: 'Test ALPN' })).toBeFocused()
  await expect(atlas.getByText(/Original branches are temporarily unavailable/)).toBeVisible()
  await expect(atlas.getByText('Predicted transmitter', { exact: true })).toBeVisible()
  await expect(atlas.getByRole('heading', { name: 'Olfactory relay' })).toBeVisible()
  await atlas.getByRole('button', { name: 'Whole brain', exact: false }).click()
  await expect(button).toBeFocused()
})

test('rapid selections never replace the current cell with a slower earlier response', async ({ page }) => {
  await stage(page, false, true)
  const atlas = page.locator('#explore')
  await atlas.getByRole('button', { name: 'Find a neuron' }).click()
  await atlas.getByRole('button', { name: `Inspect Test ALPN, neuron ${rid}` }).click()
  await atlas.getByRole('button', { name: `Inspect Test neuron 1, neuron ${other}` }).click()
  await expect(atlas.getByRole('heading', { name: 'Test neuron 1', exact: true })).toBeVisible()
  await expect(atlas.getByText('FUNCTION NOT ESTABLISHED', { exact: true })).toBeVisible()
  await page.waitForTimeout(850)
  await expect(atlas.getByRole('heading', { name: 'Test neuron 1', exact: true })).toBeVisible()
  await expect(atlas.locator('.cells-root-id')).toHaveText(other)
})

test('catalog search works without WebGL and fits the mobile viewport', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type.startsWith('webgl') || type === 'experimental-webgl') return null
      return original.call(this, type, ...args)
    } as typeof original
  })
  await stage(page)
  const atlas = page.locator('#explore')
  await expect(atlas.getByText(/This browser cannot render WebGL/)).toBeVisible()
  await atlas.getByRole('button', { name: 'Find a neuron' }).click()
  await atlas.getByLabel('Find a neuron').fill('not-in-the-dataset')
  await atlas.getByRole('button', { name: 'Search cells' }).click()
  await expect(atlas.getByText(/No neurons match this search/)).toBeVisible()
  await atlas.getByLabel('Find a neuron').fill(rid)
  await atlas.getByRole('button', { name: 'Search cells' }).click()
  await expect(atlas.getByRole('list', { name: 'Neuron search results' }).getByRole('button')).toHaveCount(1)
  await atlas.getByRole('button', { name: `Inspect Test ALPN, neuron ${rid}` }).click()
  await expect(atlas.getByRole('heading', { name: 'Olfactory relay' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2)
})
