import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('Phase 08 restores Academy progress across reload without retaining wrong answer selections',async({page})=>{
  await page.route('**/api/v1/**',r=>r.abort())
  await page.goto('/#academy')
  const academy=page.locator('#academy')
  const first=academy.locator('.academy-question').first()
  await first.getByRole('radio').first().check()
  await first.getByRole('button',{name:'Check answer'}).click()
  await academy.getByRole('navigation',{name:'Academy lesson chapters'}).getByRole('button').nth(2).click()
  await page.reload()
  await expect(academy.getByRole('progressbar')).toHaveAttribute('aria-valuenow','1')
  await expect(academy.getByRole('heading',{name:'Read a connectome',exact:true})).toBeVisible()
  await academy.getByRole('navigation',{name:'Academy lesson chapters'}).getByRole('button').first().click()
  await expect(academy.locator('.academy-question').first().getByRole('radio').first()).not.toBeChecked()
  await expect(academy.locator('.academy-chapter').first()).toContainText('1/2 checked')
  await page.goto('/#journal')
  await expect(page.locator('#journal')).toContainText('Academy checks passed')
  await expect(page.locator('#journal .journal-summary')).toContainText('03')
})

test('Phase 08 saves and reopens a graph experiment with identical numerical outputs',async({page})=>{
  await page.goto('/#lab')
  const lab=page.locator('#lab')
  await lab.getByLabel('Structural comparison — remove model node').selectOption('D')
  await lab.getByRole('button',{name:'Save to journal ☆'}).click()
  await expect(lab.getByRole('status').filter({hasText:'Experiment saved'})).toBeVisible()
  await page.reload()
  await page.goto('/#journal')
  const journal=page.locator('#journal')
  await expect(journal.locator('.journal-card')).toHaveCount(1)
  await expect(journal.locator('.journal-card')).toContainText('6 reachable original → 4 modified')
  await journal.getByRole('button',{name:'Reopen in Lab ↗'}).click()
  await expect(lab.getByLabel('Structural comparison — remove model node')).toHaveValue('D')
  await expect(lab.locator('.lab-kpis').locator('div').nth(0).locator('strong')).toHaveText('6')
  await expect(lab.locator('.lab-kpis').locator('div').nth(1).locator('strong')).toHaveText('4')
  await expect(lab.getByRole('status').filter({hasText:'Verified journal experiment restored'})).toBeVisible()
})

test('Phase 08 JSON export import roundtrip, duplicate avoidance and confirmed deletion',async({page})=>{
  await page.goto('/#lab')
  await page.locator('#lab').getByRole('button',{name:'Save to journal ☆'}).click()
  const journal=page.locator('#journal')
  const downloading=page.waitForEvent('download')
  await journal.getByRole('button',{name:'Export journal JSON ↓'}).click()
  const download=await downloading
  const raw=await readFile((await download.path())!,'utf8')
  expect(JSON.parse(raw).schema).toBe('neuroverse-journal/v1')
  page.once('dialog',d=>d.accept())
  await journal.getByRole('button',{name:'Delete record'}).click()
  await expect(journal.locator('.journal-card')).toHaveCount(0)
  await journal.locator('#journal-import-file').setInputFiles({
    name:'journal.json',mimeType:'application/json',buffer:Buffer.from(raw),
  })
  await expect(journal.locator('.journal-card')).toHaveCount(1)
  await journal.locator('#journal-import-file').setInputFiles({
    name:'journal.json',mimeType:'application/json',buffer:Buffer.from(raw),
  })
  await expect(journal.getByRole('status').filter({hasText:'duplicates skipped'})).toContainText('0 experiments imported, 1 duplicates skipped')
  await expect(journal.locator('.journal-card')).toHaveCount(1)
})

test('Phase 08 refuses tampered JSON and supports confirmed clear-all without backend',async({page})=>{
  await page.route('**/api/v1/**',r=>r.abort())
  await page.goto('/#lab')
  const lab=page.locator('#lab')
  const downloading=page.waitForEvent('download')
  await lab.getByRole('button',{name:'Export JSON ↓'}).click()
  const original=JSON.parse(await readFile((await (await downloading).path())!,'utf8'))
  await lab.getByRole('button',{name:'Save to journal ☆'}).click()
  const journal=page.locator('#journal')
  original.result.baseline.metrics.reachable=999
  await journal.locator('#journal-import-file').setInputFiles({
    name:'tampered.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(original)),
  })
  await expect(journal.getByRole('alert')).toContainText('do not reproduce')
  await expect(journal.locator('.journal-card')).toHaveCount(1)
  page.once('dialog',d=>d.dismiss())
  await journal.getByRole('button',{name:'Clear all local progress & experiments'}).click()
  await expect(journal.locator('.journal-card')).toHaveCount(1)
  page.once('dialog',d=>d.accept())
  await journal.getByRole('button',{name:'Clear all local progress & experiments'}).click()
  await expect(journal.locator('.journal-card')).toHaveCount(0)
  await expect(journal.getByText(/Journal and Academy progress cleared/)).toBeVisible()
})

test('Phase 08 local journal remains keyboard navigable and narrow-screen friendly',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('/#journal')
  const journal=page.locator('#journal')
  await expect(journal.getByRole('heading',{name:/Your discoveries/i})).toBeVisible()
  const button=journal.getByRole('button',{name:'Export journal JSON ↓'})
  await button.focus()
  await expect(button).toBeFocused()
  await expect(journal.getByText('Privacy & data ownership')).toBeVisible()
  const width=await page.evaluate(()=>({
    content:document.documentElement.scrollWidth,
    screen:document.documentElement.clientWidth,
  }))
  expect(width.content).toBeLessThanOrEqual(width.screen+2)
})
