import { expect, test } from '@playwright/test'

// These synthetic responses exist ONLY in the browser test, never in shipped science data.
const rid = '720575940625431866'
const other = '720575940625448968'

test('real-data explorer keeps accuracy disclosures and handles missing imported graph', async ({ page }) => {
  await page.route('**/api/v1/datasets/current', async (route) => {
    await route.fulfill({ json: {
      available: false, dataset: 'FlyWire FAFB', snapshot: '783',
      source_identity_verified: false,
      message: 'No local connectome is configured.',
    } })
  })
  await page.goto('/')
  const explorer = page.locator('#explore')
  await expect(explorer.getByRole('heading', { name: /the real anatomy/i })).toBeVisible()
  await expect(explorer.getByText(/No selected connectivity dataset configured/i)).toBeVisible()
  await expect(explorer.getByText(/separate display coordinates until alignment/i)).toBeVisible()
  await explorer.getByRole('button', { name: 'Inspect directed connections' }).click()
  await expect(explorer.getByRole('alert')).toContainText(/has not been imported locally/i)
  await explorer.getByText('Scientific sources and limitations').click()
  await expect(explorer.getByRole('link', { name: /whole-brain mask-derived surface/i })).toHaveAttribute('href', /FLYWIRE_whole_brain\.md/)
})

test('valid root ID loads real-format centerline while invented values are rejected', async ({ page }) => {
  await page.route('**/api/v1/datasets/current', async (route) => route.fulfill({ json: { available: false } }))
  await page.route('**/api/v1/neurons/' + rid + '/skeleton', async (route) => {
    await route.fulfill({ json: {
      root_id: rid, snapshot: '783', units: 'nanometer',
      geometry_type: 'precomputed_neuron_skeleton_centerlines',
      source_url: 'https://flyem.mrc-lmb.cam.ac.uk/flyconnectome/flywire_skeletons_783/' + rid,
      source_reference: 'https://fafbseg-py.readthedocs.io/en/latest/_modules/fafbseg/flywire/skeletonize.html',
      source_sha256: 'a'.repeat(64),
      vertex_count: 3, edge_count: 2,
      vertices: [[370000, 170000, 40000], [371000, 170000, 40000], [371000, 172000, 40500]],
      edges: [[0, 1], [1, 2]], limitations: ['Test fixture, not real evidence'],
    } })
  })
  await page.goto('/')
  const explorer = page.locator('#explore')
  await explorer.getByRole('button', { name: /load real neuron skeleton/i }).click()
  await expect(explorer.getByText(/3 recorded skeleton vertices/i)).toBeVisible()
  await expect(explorer.getByText(/2 skeletal segments/i)).toBeVisible()
  await expect(explorer.getByText(/nanometer/i)).toBeVisible()
  await explorer.getByLabel('Neuron root ID').fill('not-a-root-id')
  await explorer.getByRole('button', { name: /load real neuron skeleton/i }).click()
  await expect(explorer.getByRole('alert')).toContainText(/Enter a valid FAFB root ID/i)
})

test('bounded directed graph is explicitly algorithmic, never spatial', async ({ page }) => {
  await page.route('**/api/v1/datasets/current', async (route) => route.fulfill({ json: {
    available: true, dataset: 'FlyWire FAFB', snapshot: '783',
    nodes_selected: 2, edges_selected: 1, source_identity_verified: false,
  } }))
  await page.route('**/api/v1/neurons/' + rid, async (route) => route.fulfill({ json: {
    root_id: rid, cell_type: null, incoming_partner_count: 0,
    outgoing_partner_count: 1, incoming_selected_synapses: 0,
    outgoing_selected_synapses: 7, scope: 'selected_subgraph_only',
  } }))
  await page.route('**/api/v1/neurons/' + rid + '/neighborhood**', async (route) => route.fulfill({ json: {
    seed_root_id: rid, scope: 'selected_subgraph_only',
    direction: 'presynaptic_to_postsynaptic', structural_not_functional: true,
    nodes: [{ root_id: rid, cell_type: null }, { root_id: other, cell_type: null }],
    edges: [{ pre_root_id: rid, post_root_id: other, syn_count: 7 }],
  } }))
  await page.goto('/')
  const explorer = page.locator('#explore')
  await expect(explorer.getByText(/source identity not independently authenticated/i)).toBeVisible()
  await explorer.getByRole('button', { name: 'Inspect directed connections' }).click()
  await expect(explorer.getByRole('heading', { name: /directed structural network/i })).toBeVisible()
  await expect(explorer.getByText(/GRAPH-THEORETIC LAYOUT · NOT BRAIN COORDINATES/i)).toBeVisible()
  await explorer.getByText(/Accessible complete edge list/i).click()
  await expect(explorer.getByRole('cell', { name: other })).toBeVisible()
})

test('mobile science workspace does not overflow the viewport', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#explore')).toBeVisible()
  const sizes = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))
  expect(sizes.page).toBeLessThanOrEqual(sizes.viewport + 2)
})
