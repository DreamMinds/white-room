import { describe, expect, it } from 'vitest'
import { initialState } from '../store/state'
import { addDays, todayKey, weekKey } from '../lib/dates'
import { floorXpFor, RANK_THRESHOLDS } from './stats'
import { awardXp, processRollover, resolveDayWithPenalty } from './engine'
import type { QuestInstance } from './types'

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
