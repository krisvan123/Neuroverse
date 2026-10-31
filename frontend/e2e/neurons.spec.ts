import { expect, test, type Page } from '@playwright/test'

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
    source_url: 'https://flyem.mrc-lmb.cam.ac.uk/flyconnectome/flywire_skeletons_783/' + id,
    source_reference: 'https://doi.org/10.1038/s41586-024-07686-5', source_sha256: 'a'.repeat(64),
    vertex_count: 3, edge_count: 2, vertices: [[0, 0, 0], [100, 200, 40], [250, 100, 80]], edges: [[0, 1], [1, 2]], limitations: ['Synthetic browser-test geometry only'] }
}
async function stage(page: Page, failSkeleton = false, delayFirst = false) {
  await page.route('**/api/v1/atlas/points', route => route.fulfill({ json: {
    snapshot: '783', annotation_release: '2.1.0', units: 'nanometer', total_neurons: 3,
    soma_count: 2, unpositioned_count: 0,
    points: [[rid, 0, 0, 100000, 0], [other, -100000, 100000, 0, 1], [third, 100000, -100000, 0, 0]],
    source_reference: 'https://doi.org/10.1038/s41586-024-07686-5', source_sha256: 'a'.repeat(64),
  } }))
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
  await page.goto('/#neurons')
  await page.getByRole('button', { name: 'Load mapped neurons' }).click()
  await expect(page.getByText('3 mapped cells · FAFB 783')).toBeVisible()
}

test('a mapped cell opens through the 3D canvas with a focus animation and back navigation', async ({ page }) => {
  await stage(page)
  const atlas = page.locator('#neurons')
  const canvas = atlas.locator('canvas')
  await expect(canvas).toBeVisible()
  await expect(atlas.locator('.cells-viewport')).toHaveAttribute('data-map-ready', 'true')
  // Center point is the first neuron in the known test coordinate frame.
  await canvas.click({ position: { x: (await canvas.boundingBox())!.width / 2, y: (await canvas.boundingBox())!.height / 2 } })
  await expect(atlas.locator('.cells-viewport')).toHaveAttribute('data-transition', 'focusing')
  await expect(atlas.getByRole('heading', { name: 'Test ALPN' })).toBeVisible()
  await expect(atlas.getByText('3 recorded vertices · 2 branch segments')).toBeVisible()
  await expect(atlas.getByText('CELL-CLASS CONTEXT', { exact: true })).toBeVisible()
  await expect(atlas.locator('.cells-viewport')).toHaveAttribute('data-transition', 'idle')
  await atlas.getByRole('button', { name: 'Back to neuron map' }).click()
  await expect(atlas.getByRole('heading', { name: 'Meet the cells.' })).toBeVisible()
})

test('keyboard selection, reduced motion and source failure preserve the actual identity', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await stage(page, true)
  const atlas = page.locator('#neurons')
  const button = atlas.getByRole('button', { name: `Inspect Test ALPN, neuron ${rid}` })
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(atlas.locator('.cells-viewport')).toHaveAttribute('data-transition', 'idle')
  await expect(atlas.getByRole('heading', { name: 'Test ALPN' })).toBeFocused()
  await expect(atlas.getByText('Neuron shape unavailable', { exact: true })).toBeVisible()
  await expect(atlas.getByText('Predicted transmitter', { exact: true })).toBeVisible()
  await expect(atlas.getByRole('heading', { name: 'Olfactory relay' })).toBeVisible()
  await atlas.getByRole('button', { name: 'Back to neuron map' }).click()
  await expect(button).toBeFocused()
})

test('rapid selections never replace the current cell with a slower earlier response', async ({ page }) => {
  await stage(page, false, true)
  const atlas = page.locator('#neurons')
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
  const atlas = page.locator('#neurons')
  await expect(atlas.getByText(/3D requires WebGL/)).toBeVisible()
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
