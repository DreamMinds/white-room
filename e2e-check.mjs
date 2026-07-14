import { chromium } from 'playwright-core'

const SHOT_DIR = '/tmp/claude-0/-home-user-White-Room/f97f9d40-edde-534d-9a1d-b78ac2d86f9f/scratchpad'
const results = []
const ok = (name, cond) => {
  results.push(`${cond ? 'PASS' : 'FAIL'}: ${name}`)
  if (!cond) process.exitCode = 1
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

/** Level-Up/Rank-Up/Unlock-Fenster bestätigen, bis keins mehr offen ist. */
async function dismissBigEvents(p) {
  for (let i = 0; i < 5; i++) {
    const btn = p.getByRole('button', { name: 'Bestätigen' })
    if ((await btn.count()) === 0) break
    await btn.first().click()
    await p.waitForTimeout(300)
  }
}
const page = await browser.newPage({ viewport: { width: 400, height: 850 } })
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE ERROR:', m.text()))
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message))

await page.goto('http://127.0.0.1:4173/')
await page.waitForTimeout(800)

// --- Status screen ---
ok('Status: Header sichtbar', await page.getByText('WHITE ROOM 2.0', { exact: false }).count() > 0 || (await page.textContent('body')).includes('White Room'))
ok('Status: Level angezeigt', (await page.textContent('body')).includes('LV. 1'))
ok('Status: 7 Stats', (await page.textContent('body')).includes('Wahrnehmung'))
await page.screenshot({ path: `${SHOT_DIR}/01-status.png` })

// --- Quests: Prognose ausfüllen ---
await page.getByRole('button', { name: /Quests/i }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${SHOT_DIR}/02-quests.png` })
ok('Quests: 3 Daily Quests', (await page.textContent('body')).includes('Prognose des Tages'))

await page.getByRole('button', { name: 'Ausfüllen' }).first().click()
await page.waitForTimeout(300)
await page.locator('textarea').nth(0).fill('Wenn ich heute beim Meeting eine Nachfrage statt einer Erklärung bringe, bleibt der Frame bei mir.')
await page.locator('textarea').nth(1).fill('Weil Fragen keine Abwehr erzeugen und die Beweislast verschieben.')
await page.getByRole('button', { name: /Abschließen → Journal/ }).click()
await page.waitForTimeout(600)
await dismissBigEvents(page)
const bodyAfter = await page.textContent('body')
ok('Prognose abgeschlossen (Toast/Status)', bodyAfter.includes('Quest abgeschlossen') || bodyAfter.includes('ABGESCHLOSSEN'))
await page.screenshot({ path: `${SHOT_DIR}/03-quest-done.png` })

// --- Training mit Text-Proof abschließen ---
await page.getByRole('button', { name: 'Abschließen', exact: true }).first().click()
await page.waitForTimeout(300)
await page.locator('textarea').fill('45 Min Krav Maga Techniktraining + 8 km Lauf @ 5:40/km')
await page.getByRole('button', { name: 'Abschließen', exact: true }).last().click()
await page.waitForTimeout(600)
await dismissBigEvents(page)

// --- Status: XP angekommen? ---
await page.getByRole('button', { name: /Status/i }).click()
await page.waitForTimeout(400)
const statusBody = await page.textContent('body')
ok('XP gutgeschrieben (kein 0-XP-Stand mehr)', !statusBody.includes('XP 0 ') && /XP \d{2,}/.test(statusBody))
await page.screenshot({ path: `${SHOT_DIR}/04-status-xp.png` })

// --- Weekly Tab + Strichliste ---
await page.getByRole('button', { name: /Quests/i }).click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: /Woche/ }).click()
await page.waitForTimeout(300)
ok('Weekly Quests vorhanden', (await page.textContent('body')).includes('Modell der Woche'))
await page.getByRole('button', { name: /Strichliste/ }).click()
await page.waitForTimeout(300)
await page.locator('textarea').fill('BATNA: Vor dem Gespräch mit dem Vermieter meine Alternative definiert.')
await page.getByRole('button', { name: /Strich \+1/ }).click()
await page.waitForTimeout(400)
ok('Strichliste zählt', (await page.textContent('body')).includes('1/5'))
await page.screenshot({ path: `${SHOT_DIR}/05-tally.png` })
await page.getByRole('button', { name: 'Schließen' }).last().click()

// --- Hidden Quests Tab ---
await page.getByRole('button', { name: '???' }).click()
await page.waitForTimeout(300)
ok('Hidden Quests angedeutet', (await page.textContent('body')).includes('Das System beobachtet'))
ok('Boss Quest vorhanden', (await page.textContent('body')).includes('White Room Exam Day'))
await page.screenshot({ path: `${SHOT_DIR}/06-hidden.png` })

// --- Journal + Prognose-Auflösung ---
await page.getByRole('button', { name: /Journal/i }).click()
await page.waitForTimeout(300)
ok('Journal: Prognose-Eintrag da', (await page.textContent('body')).includes('p = 65'))
await page.getByText('Wenn ich heute beim Meeting').first().click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: /Eingetreten/ }).first().click()
await page.waitForTimeout(400)
await dismissBigEvents(page)
ok('Prognose aufgelöst', (await page.textContent('body')).includes('eingetreten'))
await page.screenshot({ path: `${SHOT_DIR}/07-journal.png` })

// --- Neue Erkenntnis ---
await page.getByRole('button', { name: /\+ Erkenntnis/ }).click()
await page.locator('textarea').fill('Zeit kaufen schlägt schnelle Zusagen: "Ich entscheide das bis morgen" hat heute funktioniert.')
await page.getByRole('button', { name: 'Speichern' }).click()
await page.waitForTimeout(300)
ok('Erkenntnis gespeichert', (await page.textContent('body')).includes('Zeit kaufen schlägt'))

// --- Codex ---
await page.getByRole('button', { name: /Codex/i }).click()
await page.waitForTimeout(300)
ok('Codex: 4 Dokumente', (await page.textContent('body')).includes('01 · Kodex & Mindset'))
ok('Codex: Master-Prompt', (await page.textContent('body')).includes('Strategy Review'))
await page.screenshot({ path: `${SHOT_DIR}/08-codex.png` })

// --- System: Claude-Link speichern ---
await page.getByRole('button', { name: /System/i }).last().click()
await page.waitForTimeout(300)
await page.locator('input[placeholder*="claude.ai"]').fill('https://claude.ai/project/test-123')
await page.getByRole('button', { name: 'Speichern' }).first().click()
await page.waitForTimeout(300)
ok('Claude-Link gespeichert (Öffnen-Button)', (await page.textContent('body')).includes('Öffnen'))
await page.screenshot({ path: `${SHOT_DIR}/09-system.png` })

// --- Persistenz + Rollover-Simulation: gestern verpasst → JokerDialog ---
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('wr-system-v1'))
  const s = raw.state
  const d = new Date(Date.now() - 86400000)
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  // Heutige offene Dailies auf gestern zurückdatieren → Rollover findet verpassten Tag
  s.lastProcessedDay = key
  for (const q of s.quests) {
    if (q.kind === 'daily' && q.status === 'open') { q.day = key; q.dueDay = key }
  }
  localStorage.setItem('wr-system-v1', JSON.stringify(raw))
})
await page.reload()
await page.waitForTimeout(1000)
const rollBody = await page.textContent('body')
ok('JokerDialog erscheint', rollBody.includes('Tagesprüfung fehlgeschlagen'))
await page.screenshot({ path: `${SHOT_DIR}/10-joker.png` })

// Joker einsetzen
await page.getByRole('button', { name: /Joker einsetzen/ }).click()
await page.waitForTimeout(500)
await dismissBigEvents(page)
ok('Joker verbraucht (Toast)', (await page.textContent('body')).includes('Joker eingesetzt'))

// --- Strafen-Flow: noch ein verpasster Tag, diesmal Strafe akzeptieren ---
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('wr-system-v1'))
  const s = raw.state
  const d = new Date(Date.now() - 86400000)
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  s.pendingDays.push({ day: key, missedTitles: ['Training: Test'], missedQuestIds: [] })
  localStorage.setItem('wr-system-v1', JSON.stringify(raw))
})
await page.reload()
await page.waitForTimeout(800)
await page.getByRole('button', { name: /Strafe akzeptieren/ }).click()
await page.waitForTimeout(600)
const penBody = await page.textContent('body')
ok('SYSTEMFEHLER-Overlay', penBody.includes('SYSTEMFEHLER'))
await page.screenshot({ path: `${SHOT_DIR}/11-penalty.png` })
await page.getByRole('button', { name: /Sanktion akzeptieren/ }).click()
await page.waitForTimeout(400)
await dismissBigEvents(page)

// Strafquest im Heute-Tab?
await page.getByRole('button', { name: /Quests/i }).click()
await page.waitForTimeout(400)
ok('Strafquest generiert', (await page.textContent('body')).includes('STRAFPROTOKOLL'))
await page.screenshot({ path: `${SHOT_DIR}/12-penaltyquest.png` })

// --- Export (Markdown Download) ---
await page.getByRole('button', { name: /Journal/i }).click()
await page.waitForTimeout(300)
const dl = page.waitForEvent('download')
await page.getByRole('button', { name: /Markdown/ }).click()
const download = await dl
ok('Markdown-Export lädt herunter', (await download.suggestedFilename()).endsWith('.md'))
await download.saveAs(`${SHOT_DIR}/export.md`)

console.log(results.join('\n'))
await browser.close()
