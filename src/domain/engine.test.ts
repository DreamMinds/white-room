import { describe, expect, it } from 'vitest'
import { initialState } from '../store/state'
import { migratePersisted } from '../store/useSystemStore'
import { DEFAULT_TRAINING_PLAN, PENALTY_QUESTS } from '../data/seed'
import { addDays, endOfMonth, monthKey, quarterKey, todayKey, uid, weekKey } from '../lib/dates'
import { floorXpFor, RANK_THRESHOLDS } from './stats'
import {
  awardXp,
  checkHiddenQuests,
  forecastStats,
  incrementCounter,
  processRollover,
  resolveDayWithPenalty,
} from './engine'
import type { QuestInstance } from './types'
import type { WRState } from '../store/state'

describe('floorXpFor (Rang-Boden)', () => {
  it('gibt für frische Stats keinen Boden (F = 0)', () => {
    expect(floorXpFor(0)).toBe(0)
  })

  it('klemmt auf die Schwelle des erreichten Rangs', () => {
    expect(floorXpFor(1500)).toBe(RANK_THRESHOLDS.D) // genau D
    expect(floorXpFor(2000)).toBe(RANK_THRESHOLDS.D) // innerhalb D → Boden bleibt D
    expect(floorXpFor(7000)).toBe(RANK_THRESHOLDS.B)
  })

  it('S ist der einzige Rang, von dem man zurückfallen kann (Boden = A)', () => {
    expect(floorXpFor(RANK_THRESHOLDS.S)).toBe(RANK_THRESHOLDS.A)
    expect(floorXpFor(25000)).toBe(RANK_THRESHOLDS.A)
    expect(RANK_THRESHOLDS.A).toBe(12500)
  })
})

describe('awardXp', () => {
  it('zieht peakXp mit den XP nach oben', () => {
    const s = initialState()
    awardXp(s, { strength: 300 }, todayKey())
    expect(s.stats.strength.xp).toBe(300)
    expect(s.stats.strength.peakXp).toBe(300)
  })
})

describe('resolveDayWithPenalty (Daily-Strafe = 0,5)', () => {
  function pendingSetup(xp: number, peakXp: number, reward: number) {
    const s = initialState()
    s.stats.strength.xp = xp
    s.stats.strength.peakXp = peakXp
    const q: QuestInstance = {
      id: 'q1',
      templateId: 'daily_training',
      kind: 'daily',
      title: 'Training',
      desc: '',
      day: todayKey(),
      dueDay: todayKey(),
      rewards: { strength: reward },
      proof: 'photo',
      status: 'open',
      required: true,
    }
    s.quests.push(q)
    resolveDayWithPenalty(s, { day: todayKey(), missedTitles: ['Training'], missedQuestIds: ['q1'] })
    return s
  }

  it('zieht 50 % der Belohnung ab', () => {
    const s = pendingSetup(1600, 1600, 40) // Boden D = 1500
    expect(s.stats.strength.xp).toBe(1580) // 1600 - round(40*0.5)
  })

  it('fällt nie unter den Rang-Boden', () => {
    const s = pendingSetup(1510, 1600, 40) // 1510 - 20 = 1490 < Boden 1500
    expect(s.stats.strength.xp).toBe(1500)
  })

  it('S-Stat fällt maximal bis A (12500), nie darunter', () => {
    const s = pendingSetup(RANK_THRESHOLDS.S, RANK_THRESHOLDS.S, 40000) // Verlust 20000
    expect(s.stats.strength.xp).toBe(RANK_THRESHOLDS.A)
  })
})

describe('processRollover — Weekly/Boss-Verfall = 0,25', () => {
  it('zieht bei verfallenem Weekly nur 25 % ab', () => {
    const s = initialState()
    const today = todayKey()
    s.lastProcessedDay = today
    s.stats.strength.xp = 5000 // Rang C, Boden 3500 → nicht berührt
    s.stats.strength.peakXp = 5000
    s.stats.strength.lastActivity = today // kein Decay
    // Hidden-Quest, die bei xp>=500 zünden würde, vorab freischalten — sonst verfälscht ihr
    // Bonus-XP die Messung des Verfall-Abzugs.
    s.unlocks.push({ id: 'hidden_firstrank', unlockedAt: new Date().toISOString() })
    const weekly: QuestInstance = {
      id: 'w1',
      templateId: 'weekly_model',
      kind: 'weekly',
      title: 'Modell der Woche',
      desc: '',
      day: today,
      period: weekKey(today), // verhindert Neu-Generierung
      dueDay: addDays(today, -1), // gestern → verfallen
      rewards: { strength: 60 },
      proof: 'counter',
      status: 'open',
      required: false,
    }
    s.quests.push(weekly)
    processRollover(s)
    expect(weekly.status).toBe('failed')
    expect(s.stats.strength.xp).toBe(4985) // 5000 - round(60*0.25) = 5000 - 15
  })
})

// ---------- Neue Features (Rework 2026-07-20) ----------

function addResolvedForecast(s: WRState, p: number, outcome: 'right' | 'wrong') {
  s.journal.push({
    id: uid('j'),
    createdAt: new Date().toISOString(),
    kind: 'forecast',
    title: 'Test-Prognose',
    forecast: { p, resolved: outcome, resolvedAt: new Date().toISOString() },
  })
}

describe('forecastStats — Brier & echte Wetten', () => {
  it('berechnet den Brier-Score als Mittel über (p/100 − outcome)²', () => {
    const s = initialState()
    addResolvedForecast(s, 60, 'right') // (0.6-1)² = 0.16
    addResolvedForecast(s, 80, 'wrong') // (0.8-0)² = 0.64
    const fc = forecastStats(s)
    expect(fc.brier).toBeCloseTo(0.4, 5)
    expect(fc.realBets).toBe(1) // nur die 60er liegt in 35–70
  })

  it('Orakel-Unlock: ≥10 aufgelöst, Brier ≤ 0.20, ≥3 echte Wetten', () => {
    const s = initialState()
    for (let i = 0; i < 10; i++) addResolvedForecast(s, 65, 'right') // Brier (0.35)² ≈ 0.1225
    checkHiddenQuests(s)
    expect(s.unlocks.some((u) => u.id === 'hidden_calibration')).toBe(true)
  })

  it('Anti-Safe-Bet: 10× p=95 richtig ⇒ kein Unlock (realBets < 3)', () => {
    const s = initialState()
    for (let i = 0; i < 10; i++) addResolvedForecast(s, 95, 'right') // Brier winzig, aber keine echte Wette
    checkHiddenQuests(s)
    expect(s.unlocks.some((u) => u.id === 'hidden_calibration')).toBe(false)
  })

  it('hohe Trefferquote mit schlechter Kalibrierung reicht nicht (Brier > 0.20)', () => {
    const s = initialState()
    for (let i = 0; i < 7; i++) addResolvedForecast(s, 40, 'right') // (0.6)² = 0.36 je
    for (let i = 0; i < 3; i++) addResolvedForecast(s, 40, 'wrong') // (0.4)² = 0.16 je
    const fc = forecastStats(s)
    expect(fc.resolved).toBe(10)
    expect(fc.realBets).toBe(10)
    expect(fc.brier).toBeGreaterThan(0.2)
    checkHiddenQuests(s)
    expect(s.unlocks.some((u) => u.id === 'hidden_calibration')).toBe(false)
  })
})

describe('Monthly- & Kampagnen-Quests', () => {
  it('generiert pro Monat genau eine Benchmark-Quest mit Deadline Monatsende', () => {
    const s = initialState()
    processRollover(s)
    processRollover(s) // zweiter Lauf darf nicht duplizieren
    const monthly = s.quests.filter((q) => q.kind === 'monthly')
    expect(monthly).toHaveLength(1)
    expect(monthly[0].templateId).toBe('monthly_benchmark')
    expect(monthly[0].period).toBe(monthKey(todayKey()))
    expect(monthly[0].dueDay).toBe(endOfMonth(todayKey()))
  })

  it('verfallene Monthly-Quest → failed + 25 % XP-Abzug', () => {
    const s = initialState()
    const today = todayKey()
    s.lastProcessedDay = today
    s.stats.strategy.xp = 5000
    s.stats.strategy.peakXp = 5000
    s.stats.strategy.lastActivity = today
    s.unlocks.push({ id: 'hidden_firstrank', unlockedAt: new Date().toISOString() })
    const q: QuestInstance = {
      id: 'm1',
      templateId: 'monthly_benchmark',
      kind: 'monthly',
      title: 'Externes Scoreboard',
      desc: '',
      day: today,
      period: monthKey(today),
      dueDay: addDays(today, -1),
      rewards: { strategy: 60 },
      proof: 'form',
      status: 'open',
      required: false,
    }
    s.quests.push(q)
    processRollover(s)
    expect(q.status).toBe('failed')
    expect(s.stats.strategy.xp).toBe(4985)
  })

  it('generiert die Kampagnen-Quest genau einmal pro Quartal', () => {
    const s = initialState()
    processRollover(s)
    processRollover(s)
    const campaign = s.quests.filter((q) => q.kind === 'campaign')
    expect(campaign).toHaveLength(1)
    expect(campaign[0].templateId).toBe('quarterly_campaign')
    expect(campaign[0].period).toBe(quarterKey(todayKey()))
    // Deadline liegt nie in der Vergangenheit (später Einstieg → 14 Tage ab Generierung)
    expect(campaign[0].dueDay >= todayKey() || campaign[0].dueDay.slice(8) === '14').toBe(true)
  })
})

describe('Penalty nutzt Template-Rewards', () => {
  it('vergibt die Rewards der gewählten Strafe (Index 0 = Kalt-Analyse)', () => {
    const s = initialState()
    const today = todayKey()
    const q: QuestInstance = {
      id: 'q1',
      templateId: 'daily_training',
      kind: 'daily',
      title: 'Training',
      desc: '',
      day: today,
      dueDay: today,
      rewards: { strength: 40 },
      proof: 'photo',
      status: 'open',
      required: true,
    }
    s.quests.push(q)
    resolveDayWithPenalty(s, { day: today, missedTitles: ['Training'], missedQuestIds: ['q1'] }, new Date(), 0)
    const penalty = s.quests.find((x) => x.kind === 'penalty')
    expect(penalty?.title).toBe(PENALTY_QUESTS[0].title)
    expect(penalty?.rewards).toEqual(PENALTY_QUESTS[0].rewards)
    expect(penalty?.proof).toBe('text')
  })
})

describe('weekly_uncomfortable als Counter (Target 2)', () => {
  it('ist nach 2 Strichen abgeschlossen', () => {
    const s = initialState()
    const today = todayKey()
    const q: QuestInstance = {
      id: 'u1',
      templateId: 'weekly_uncomfortable',
      kind: 'weekly',
      title: 'Bewusst unangenehme Situationen (2×)',
      desc: '',
      day: today,
      period: weekKey(today),
      dueDay: addDays(today, 6),
      rewards: { strength: 40, influence: 20 },
      proof: 'counter',
      formKind: 'uncomfortable',
      counterTarget: 2,
      counterCount: 0,
      status: 'open',
      required: false,
    }
    s.quests.push(q)
    incrementCounter(s, 'u1', 'Grenze gesetzt')
    expect(q.status).toBe('open')
    incrementCounter(s, 'u1', 'Nachfrage statt Erklärung')
    expect(q.status).toBe('done')
  })
})

describe('Migration auf v4 (Trainingsplan-Ersatz)', () => {
  it('ersetzt den eingefrorenen Trainingsplan durch den neuen Default (So = Ruhetag, Do = Mobilität)', () => {
    const s = initialState()
    s.settings.trainingPlan = [
      { title: 'Alt-Mo', desc: '', rewards: { strength: 1 } },
      { title: 'Alt-Di', desc: '', rewards: { strength: 1 } },
      { title: 'Alt-Mi', desc: '', rewards: { strength: 1 } },
      { title: 'Plyometrics + Kraftsport', desc: '', rewards: { strength: 1 } },
      { title: 'Alt-Fr', desc: '', rewards: { strength: 1 } },
      { title: 'Alt-Sa', desc: '', rewards: { strength: 1 } },
      { title: 'Alt-So', desc: '', rewards: { strength: 1 } },
    ]
    const migrated = migratePersisted(s, 2)
    expect(migrated.settings.trainingPlan).toEqual(DEFAULT_TRAINING_PLAN)
    expect(migrated.settings.trainingPlan[6].title).toBe('Ruhetag / Recovery')
    expect(migrated.settings.trainingPlan[3].title).toBe('Mobilität')
  })

  it('ersetzt den Plan auch bei v3-Ständen (Ruhetag-Tausch Do→So)', () => {
    const s = initialState()
    s.settings.trainingPlan = [...DEFAULT_TRAINING_PLAN.slice(3), ...DEFAULT_TRAINING_PLAN.slice(0, 3)]
    const migrated = migratePersisted(s, 3)
    expect(migrated.settings.trainingPlan).toEqual(DEFAULT_TRAINING_PLAN)
  })

  it('lässt peakXp-Backfill (v1→v2) weiterhin laufen', () => {
    const s = initialState()
    s.stats.strength.xp = 700
    s.stats.strength.peakXp = 0
    const migrated = migratePersisted(s, 1)
    expect(migrated.stats.strength.peakXp).toBe(700)
  })
})
