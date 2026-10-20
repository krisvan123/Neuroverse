import { expect,test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('Phase 07 Lab runs BFS, DFS, threshold and non-destructive structural comparison',async({page})=>{
  const errors:string[]=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.route('**/api/v1/**',route=>route.abort())
  await page.goto('/#lab')
  const lab=page.locator('#lab')
  await expect(lab.getByRole('heading',{name:/Test the network/i})).toBeVisible()
  await expect(lab.locator('.lab-source-badge')).toContainText('SYNTHETIC TEACHING GRAPH')
  await expect(lab.getByRole('table',{name:/Numerical results/i})).toContainText('Loop-excluded directed density')
  await expect(lab.getByRole('button',{name:'Next step →'})).toBeEnabled()
  await lab.getByRole('button',{name:'Next step →'}).click()
  await expect(lab.getByRole('status').filter({hasText:'Process A'})).toContainText('B → C')
  await lab.getByLabel('Traversal algorithm').selectOption('dfs')
  await expect(lab.getByText('DFS traversal timeline')).toBeVisible()
  await lab.getByRole('button',{name:'Next step →'}).click()
  await expect(lab.getByRole('status').filter({hasText:'Visit A'})).toContainText('DFS recursion path')
  await lab.getByLabel('Structural comparison — remove model node').selectOption('D')
  await expect(lab.locator('.lab-kpis')).toContainText('Original reachable')
  await expect(lab.locator('.lab-kpis')).toContainText('Modified reachable')
  await expect(lab.locator('.lab-kpis').locator('div').nth(0).locator('strong')).toHaveText('6')
  await expect(lab.locator('.lab-kpis').locator('div').nth(1).locator('strong')).toHaveText('4')
  await expect(lab.locator('.lab-impact')).toContainText('Surviving nodes newly unreachable: E')
  await lab.getByRole('button',{name:'Modified model'}).click()
  await expect(lab.getByRole('figure').getByText(/Modified model \(without D\)/)).toBeVisible()
  await lab.getByLabel('Minimum synthetic edge weight').fill('2')
  await expect(lab.locator('.lab-kpis').locator('div').nth(0).locator('strong')).toHaveText('1')
  await expect(lab.locator('.lab-kpis').locator('div').nth(1).locator('strong')).toHaveText('1')
  await lab.getByLabel('Minimum synthetic edge weight').fill('1')
  await expect(lab.locator('.lab-kpis').locator('div').nth(0).locator('strong')).toHaveText('6')
  await expect(errors).toEqual([])
})

test('Phase 07 exports reproducible full input and results in JSON and CSV',async({page})=>{
  await page.goto('/#lab')
  const lab=page.locator('#lab')
  await lab.getByLabel('Structural comparison — remove model node').selectOption('D')
  const whenJSON=page.waitForEvent('download')
  await lab.getByRole('button',{name:'Export JSON ↓'}).click()
  const jsonDownload=await whenJSON
  expect(jsonDownload.suggestedFilename()).toBe('neuroverse-phase07-synthetic-bfs.json')
  const json=JSON.parse(await readFile((await jsonDownload.path())!,'utf8'))
  expect(json.schema).toBe('neuroverse-lab/v1')
  expect(json.graph.origin).toBe('synthetic-teaching-example')
  expect(json.graph.nodes).toHaveLength(7)
  expect(json.graph.edges).toHaveLength(7)
  expect(json.parameters.removeNode).toBe('D')
  expect(json.result.baseline.metrics.reachable).toBe(6)
  expect(json.result.modified.metrics.reachable).toBe(4)
  expect(json.result.newlyUnreachableSurvivors).toEqual(['E'])
  expect(json.limitations.join(' ')).toMatch(/mathematical model properties/)
  const whenCSV=page.waitForEvent('download')
  await lab.getByRole('button',{name:'Export CSV ↓'}).click()
  const csvDownload=await whenCSV
  expect(csvDownload.suggestedFilename()).toBe('neuroverse-phase07-synthetic-bfs.csv')
  const csv=await readFile((await csvDownload.path())!,'utf8')
  expect(csv).toContain('"edge","A","B","1"')
  expect(csv).toContain('"metric","baseline","reachable","6"')
  expect(csv).toContain('"metric","modified","reachable","4"')
  expect(csv).toContain('"setting","removeNode","","D"')
  await expect(lab.getByRole('status').filter({hasText:'saved from this session'})).toBeVisible()
})

test('Phase 07 refuses to fabricate FAFB data when local API has no imported connectivity',async({page})=>{
  await page.route('**/api/v1/datasets/current',route=>route.fulfill({
    json:{available:false,dataset:'FlyWire FAFB',snapshot:'783',source_identity_verified:false},
  }))
  await page.goto('/#lab')
  const lab=page.locator('#lab')
  await lab.getByRole('button',{name:'Imported FAFB v783'}).click()
  await expect(lab.getByText('No real connectivity data loaded')).toBeVisible()
  await lab.getByRole('button',{name:'Load local FAFB subgraph'}).click()
  await expect(lab.getByRole('alert')).toContainText('No valid local FAFB v783 dataset')
  await expect(lab.getByRole('link',{name:/How to import real FAFB connections/i}))
    .toHaveAttribute('href',/scientific-data-pipeline/)
  await expect(lab.locator('.lab-kpis')).toHaveCount(0)
  await lab.getByRole('button',{name:'Synthetic teaching graph'}).click()
  await expect(lab.locator('.lab-kpis')).toBeVisible()
})

test('Phase 07 uses API-provided bounded FAFB data and explicitly states unverified provenance',async({page})=>{
  const seed='720575940625431866'
  const other='720575940625448968'
  const third='720575940625444444'
  await page.route('**/api/v1/datasets/current',route=>route.fulfill({
    json:{available:true,dataset:'FlyWire FAFB',snapshot:'783',seed_root_id:seed,
      source_identity_verified:false,database_sha256:'a'.repeat(64),
      license:'CC BY-NC 4.0',
      source_reference:'Official-style imported CSV fixture for automated browser QA only; NOT a scientific observation.'},
  }))
  await page.route('**/api/v1/neurons/**/neighborhood**',route=>route.fulfill({
    json:{seed_root_id:seed,scope:'selected_subgraph_only',direction:'presynaptic_to_postsynaptic',
      structural_not_functional:true,
      nodes:[{root_id:seed,cell_type:null},{root_id:other,cell_type:null},{root_id:third,cell_type:null}],
      edges:[{pre_root_id:seed,post_root_id:other,syn_count:5},
        {pre_root_id:other,post_root_id:third,syn_count:9}]},
  }))
  await page.goto('/#lab')
  const lab=page.locator('#lab')
  await lab.getByRole('button',{name:'Imported FAFB v783'}).click()
  await lab.getByRole('button',{name:'Load local FAFB subgraph'}).click()
  await expect(lab.getByText(/USER-IMPORTED FAFB V783/i)).toBeVisible()
  await expect(lab.locator('.lab-source-details')).toContainText('NOT independently authenticated')
  await expect(lab.locator('.lab-source-details')).toContainText('CC BY-NC 4.0')
  await expect(lab.locator('.lab-kpis').locator('div').nth(0).locator('strong')).toHaveText('3')
  await lab.getByLabel('Minimum identified synapses / retained pair').fill('6')
  await expect(lab.locator('.lab-kpis').locator('div').nth(0).locator('strong')).toHaveText('1')
  await lab.getByLabel('Minimum identified synapses / retained pair').fill('1')
  const wait=page.waitForEvent('download')
  await lab.getByRole('button',{name:'Export JSON ↓'}).click()
  const downloaded=await wait
  const data=JSON.parse(await readFile((await downloaded.path())!,'utf8'))
  expect(data.graph.origin).toBe('fafb-v783-local-subgraph')
  expect(data.graph.snapshot).toBe('783')
  expect(data.graph.sourceIdentityVerified).toBe(false)
  expect(data.graph.nodes.map((n:{id:string})=>n.id)).toContain(seed)
  expect(data.parameters.start).toBe(seed)
  expect(data.graph.edges).toHaveLength(2)
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(2)
})
