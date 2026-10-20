import { expect, test } from '@playwright/test'

test('Academy has five evidence-mapped lessons, accessible sources and a complete novice path', async ({ page }) => {
  const errors: string[]=[]
  page.on('pageerror', e=>errors.push(e.message))
  await page.goto('/#academy')
  const academy=page.locator('#academy')
  await expect(academy.getByRole('heading',{name:/Learn the science/i})).toBeVisible()
  const nav=academy.getByRole('navigation',{name:'Academy lesson chapters'})
  await expect(nav.getByRole('button')).toHaveCount(5)
  await expect(academy.getByRole('progressbar',{name:'Knowledge checks answered correctly'}))
    .toHaveAttribute('aria-valuenow','0')
  await expect(academy.getByRole('link',{name:/S-008/}).first())
    .toHaveAttribute('href',/openstax\.org/)
  // A wrong answer gives a meaningful explanation rather than a fake pass.
  const first=academy.locator('.academy-question').first()
  await first.getByRole('radio').nth(1).check()
  await first.getByRole('button',{name:'Check answer'}).click()
  await expect(first.getByRole('status')).toContainText('Not quite')
  await expect(academy.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0')
  const answers=[[0,1],[2,0],[1,2],[0,1],[2,0]]
  for (let chapter=0;chapter<5;chapter++){
    await nav.getByRole('button').nth(chapter).click()
    const title=['Meet the neuron','How chemical synapses work','Read a connectome',
      'Walk a directed network','What a wiring diagram cannot prove'][chapter]
    await expect(academy.getByRole('heading',{name:title,exact:true})).toBeVisible()
    const questions=academy.locator('.academy-question')
    for (let q=0;q<2;q++){
      const question=questions.nth(q)
      await question.getByRole('radio').nth(answers[chapter]![q]!).check()
      await question.getByRole('button',{name:'Check answer'}).click()
      await expect(question.getByRole('status')).toContainText('Correct')
    }
    if(chapter===3){
      const demo=academy.locator('.academy-graph')
      await expect(demo.getByText(/SYNTHETIC TEACHING EXAMPLE/i)).toBeVisible()
      for(let step=0;step<6;step++)await demo.getByRole('button',{name:/Next BFS step/}).click()
      await expect(demo.getByRole('button',{name:'Traversal complete'})).toBeDisabled()
      await demo.getByRole('button',{name:'Compare original vs node D removed'}).click()
      await expect(demo.getByText(/6 nodes reachable from A/)).toBeVisible()
      await expect(demo.getByText(/4 nodes reachable/)).toBeVisible()
      await expect(demo.getByText(/Teaching demo complete/)).toBeVisible()
    }
  }
  await expect(academy.getByRole('progressbar')).toHaveAttribute('aria-valuenow','10')
  await expect(academy.getByText(/Mission 001 complete — all ten checks passed/i)).toBeVisible()
  await expect(academy.getByText(/Progress stays in this page session only/i)).toBeVisible()
  const sources=academy.getByText('Primary sources & research methods')
  await expect(sources).toBeVisible()
  await expect(academy.getByText('Science glossary — 14 key terms')).toBeVisible()
  await expect(errors).toEqual([])
})

test('academy stays readable on narrow viewport, offline science and keyboard navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' })
  await page.route('**/api/v1/**',route=>route.abort())
  await page.goto('/')
  const academy=page.locator('#academy')
  await expect(academy.getByRole('heading',{name:/Learn the science/i})).toBeVisible()
  const nav=academy.getByRole('navigation',{name:'Academy lesson chapters'})
  const second=nav.getByRole('button').nth(1)
  await second.focus()
  await page.keyboard.press('Enter')
  await expect(academy.getByRole('heading',{name:'How chemical synapses work'})).toBeVisible()
  await expect(academy.locator('.academy-article-section').first()).toContainText('chemical synapse')
  await expect(academy.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0')
  const sizes=await page.evaluate(()=>({
    page:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
  }))
  expect(sizes.page).toBeLessThanOrEqual(sizes.viewport+2)
  await expect(academy.getByRole('link',{name:/S-009/}).first())
    .toHaveAttribute('href',/openstax\.org/)
  // Lessons are still available with all biological API calls offline.
  await nav.getByRole('button').nth(3).click()
  await expect(academy.getByRole('heading',{name:'Walk a directed network'})).toBeVisible()
  await academy.locator('.academy-graph').getByRole('button',{name:/Remove model node D/}).click()
  await expect(academy.locator('.academy-graph')).toContainText('D removed')
})

test('Academy progress never pretends to persist between separate sessions',async ({ page })=>{
  await page.goto('/#academy')
  const academy=page.locator('#academy')
  const question=academy.locator('.academy-question').first()
  await question.getByRole('radio').first().check()
  await question.getByRole('button',{name:'Check answer'}).click()
  await expect(academy.getByRole('progressbar')).toHaveAttribute('aria-valuenow','1')
  await page.reload()
  await expect(academy.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0')
})
