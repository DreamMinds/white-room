import {
  BOSS_TEMPLATE,
  DAILY_FORECAST,
  DAILY_POSTGAME,
  HIDDEN_QUESTS,
  PENALTY_QUESTS,
  WEEKLY_TEMPLATES,
} from '../data/seed'
import {
  addDays,
  daysBetween,
  monthKey,
  quarterKey,
  sundayOf,
  todayKey,
  uid,
  weekKey,
  weekdayOf,
} from '../lib/dates'
import { STAT_IDS, STAT_META, decayForInactiveDays, floorXpFor, levelFor, rankFor } from './stats'
import type {
  JournalEntry,
  PendingDay,
  QuestInstance,
  StatId,
  SystemEvent,
} from './types'
import type { WRState } from '../store/state'

export const JOKERS_PER_MONTH = 3
export const MIN_MODE_FACTOR = 0.25
export const PENALTY_FACTOR = 0.5
/** Verfall von Weekly/Boss ist milder: die Belohnungen (und damit der Abzug) sind ohnehin viel größer. */
export const WEEKLY_PENALTY_FACTOR = 0.25

// ---------- Events ----------

function pushEvent(state: WRState, ev: Omit<SystemEvent, 'id'>) {
  state.events.push({ ...ev, id: uid('ev') })
}

// ---------- XP ----------

function totalXp(state: WRState): number {
  return STAT_IDS.reduce((sum, s) => sum + state.stats[s].xp, 0)
}

/** XP gutschreiben; meldet Level-Ups und Rang-Aufstiege als System-Events. */
export function awardXp(
  state: WRState,
  rewards: Partial<Record<StatId, number>>,
  day: string,
  factor = 1,
) {
  const levelBefore = levelFor(totalXp(state))
  for (const [statId, amount] of Object.entries(rewards) as Array<[StatId, number]>) {
    const gain = Math.round(amount * factor)
    if (gain <= 0) continue
    const stat = state.stats[statId]
    const rankBefore = rankFor(stat.xp)
    stat.xp += gain
    stat.peakXp = Math.max(stat.peakXp ?? 0, stat.xp)
    if (daysBetween(stat.lastActivity, day) > 0) stat.lastActivity = day
    const rankAfter = rankFor(stat.xp)
    if (rankAfter !== rankBefore) {
      pushEvent(state, {
        type: 'rankup',
        message: `RANG-AUFSTIEG: ${STAT_META[statId].name}`,
        detail: `${STAT_META[statId].name}: ${rankBefore} → ${rankAfter}`,
      })
    }
  }
  const levelAfter = levelFor(totalXp(state))
  if (levelAfter > levelBefore) {
    pushEvent(state, { type: 'levelup', message: `LEVEL UP`, detail: `Level ${levelAfter} erreicht.` })
  }
}

function loseXp(state: WRState, losses: Partial<Record<StatId, number>>) {
  for (const [statId, amount] of Object.entries(losses) as Array<[StatId, number]>) {
    const stat = state.stats[statId]
    stat.xp = Math.max(floorXpFor(stat.peakXp ?? 0), stat.xp - amount)
  }
}

// ---------- Quest-Generierung ----------

function makeDailyQuests(state: WRState, day: string): QuestInstance[] {
  const training = state.settings.trainingPlan[weekdayOf(day)]
  const base = { kind: 'daily' as const, day, dueDay: day, status: 'open' as const, required: true }
  return [
    {
      ...base,
      id: uid('q'),
      templateId: 'daily_training',
      title: `Training: ${training.title}`,
      desc: `${training.desc} — Es gilt: lieber 5 Min als gar nicht.`,
      rewards: training.rewards,
      proof: 'photo',
      minAllowed: true,
    },
    {
      ...base,
      id: uid('q'),
      templateId: DAILY_FORECAST.templateId,
      title: DAILY_FORECAST.title,
      desc: DAILY_FORECAST.desc,
      rewards: DAILY_FORECAST.rewards,
      proof: 'form',
      formKind: 'forecast',
    },
    {
      ...base,
      id: uid('q'),
      templateId: DAILY_POSTGAME.templateId,
      title: DAILY_POSTGAME.title,
      desc: DAILY_POSTGAME.desc,
      rewards: DAILY_POSTGAME.rewards,
      proof: 'form',
      formKind: 'postgame',
    },
  ]
}

function makeWeeklyQuests(day: string): QuestInstance[] {
  const period = weekKey(day)
  const dueDay = sundayOf(day)
  return WEEKLY_TEMPLATES.map((t) => ({
    id: uid('q'),
    templateId: t.templateId,
    kind: 'weekly' as const,
    title: t.title,
    desc: t.desc,
    day,
    period,
    dueDay,
    rewards: t.rewards,
    proof: t.proof,
    formKind: t.formKind,
    counterTarget: t.counterTarget,
    counterCount: t.counterTarget ? 0 : undefined,
    status: 'open' as const,
    required: false,
  }))
}

function makeBossQuest(day: string): QuestInstance {
  const period = quarterKey(day)
  const [y, q] = period.split('-Q')
  const endMonth = Number(q) * 3
  const lastDay = new Date(Number(y), endMonth, 0)
  return {
    id: uid('q'),
    templateId: BOSS_TEMPLATE.templateId,
    kind: 'boss',
    title: BOSS_TEMPLATE.title,
    desc: BOSS_TEMPLATE.desc,
    day,
    period,
    dueDay: todayKey(lastDay),
    rewards: BOSS_TEMPLATE.rewards,
    proof: 'form',
    formKind: 'sparring',
    status: 'open',
    required: false,
  }
}

// ---------- Tages-Rollover ----------

/**
 * Verarbeitet alle Tage seit dem letzten App-Start:
 * Quests generieren, abgelaufene Tage bewerten (→ pendingDays für Joker/Strafe),
 * Weekly-Deadlines, Streak, Decay, Joker-Monatsreset.
 */
export function processRollover(state: WRState, now: Date = new Date()) {
  const today = todayKey(now)

  // Joker-Monatsreset
  const month = monthKey(today)
  if (state.joker.month !== month) {
    state.joker.month = month
    state.joker.used = 0
  }

  if (state.lastProcessedDay === '') state.lastProcessedDay = today

  // Fehlende Tage generieren (inkl. heute)
  let cursor = state.lastProcessedDay
  while (daysBetween(cursor, today) >= 0) {
    if (!state.quests.some((q) => q.kind === 'daily' && q.day === cursor)) {
      state.quests.push(...makeDailyQuests(state, cursor))
    }
    if (!state.quests.some((q) => q.kind === 'weekly' && q.period === weekKey(cursor))) {
      state.quests.push(...makeWeeklyQuests(cursor))
    }
    if (!state.quests.some((q) => q.kind === 'boss' && q.period === quarterKey(cursor))) {
      state.quests.push(makeBossQuest(cursor))
    }
    if (cursor === today) break
    cursor = addDays(cursor, 1)
  }

  // Vergangene Tage auswerten (Streak / Fehltage)
  let evalDay = state.lastProcessedDay
  while (daysBetween(evalDay, today) > 0) {
    evaluateDay(state, evalDay)
    evalDay = addDays(evalDay, 1)
  }

  // Weekly & Boss: Deadline überschritten → failed + XP-Abzug (kein Joker)
  for (const q of state.quests) {
    if ((q.kind === 'weekly' || q.kind === 'boss' || q.kind === 'penalty') && q.status === 'open' && daysBetween(q.dueDay, today) > 0) {
      q.status = 'failed'
      const factor = q.kind === 'penalty' ? PENALTY_FACTOR : WEEKLY_PENALTY_FACTOR
      const losses: Partial<Record<StatId, number>> = {}
      for (const [s, v] of Object.entries(q.rewards) as Array<[StatId, number]>) {
        losses[s] = Math.round(v * factor)
      }
      loseXp(state, losses)
      pushEvent(state, {
        type: 'toast',
        message: `[SYSTEM] Quest verfallen: ${q.title}`,
        detail: 'XP-Abzug auf verknüpfte Stats.',
      })
    }
  }

  // Decay pro verstrichenem Tag
  const daysPassed = daysBetween(state.lastProcessedDay, today)
  if (daysPassed > 0) {
    for (const s of STAT_IDS) {
      const stat = state.stats[s]
      let loss = 0
      for (let i = 1; i <= daysPassed; i++) {
        const inactive = daysBetween(stat.lastActivity, addDays(state.lastProcessedDay, i))
        loss += decayForInactiveDays(inactive)
      }
      if (loss > 0) stat.xp = Math.max(floorXpFor(stat.peakXp ?? 0), stat.xp - loss)
    }
  }

  // Alte erledigte Quests ausdünnen (Speicher schonen, Historie 90 Tage)
  state.quests = state.quests.filter(
    (q) => daysBetween(q.day, today) <= 90 || q.status === 'open',
  )

  state.lastProcessedDay = today
  checkHiddenQuests(state)
}

/** Bewertet einen abgeschlossenen Kalendertag: Streak hoch oder pendingDay anlegen. */
function evaluateDay(state: WRState, day: string) {
  const dailies = state.quests.filter((q) => q.kind === 'daily' && q.day === day && q.required)
  if (dailies.length === 0) return
  const missed = dailies.filter((q) => q.status === 'open')
  if (missed.length === 0) {
    const failed = dailies.some((q) => q.status === 'failed')
    const jokered = dailies.some((q) => q.status === 'joker')
    if (!failed && !jokered) {
      state.streak += 1
      state.bestStreak = Math.max(state.bestStreak, state.streak)
    }
    return
  }
  if (state.pendingDays.some((p) => p.day === day)) return
  state.pendingDays.push({
    day,
    missedTitles: missed.map((q) => q.title),
    missedQuestIds: missed.map((q) => q.id),
  })
}

// ---------- Joker & Strafe ----------

export function jokersLeft(state: WRState): number {
  return Math.max(0, JOKERS_PER_MONTH - state.joker.used)
}

export function resolveDayWithJoker(state: WRState, pending: PendingDay) {
  if (jokersLeft(state) <= 0) return
  state.joker.used += 1
  state.joker.log.push({
    day: pending.day,
    usedAt: new Date().toISOString(),
    reason: pending.missedTitles.join(', '),
  })
  for (const id of pending.missedQuestIds) {
    const q = state.quests.find((x) => x.id === id)
    if (q) q.status = 'joker'
  }
  state.pendingDays = state.pendingDays.filter((p) => p.day !== pending.day)
  pushEvent(state, {
    type: 'toast',
    message: `[SYSTEM] Joker eingesetzt für ${pending.day}.`,
    detail: `Verbleibend diesen Monat: ${jokersLeft(state)}. Der Streak wurde eingefroren.`,
  })
}

export function resolveDayWithPenalty(state: WRState, pending: PendingDay, now: Date = new Date()) {
  const today = todayKey(now)
  const losses: Partial<Record<StatId, number>> = {}
  for (const id of pending.missedQuestIds) {
    const q = state.quests.find((x) => x.id === id)
    if (!q) continue
    q.status = 'failed'
    for (const [s, v] of Object.entries(q.rewards) as Array<[StatId, number]>) {
      losses[s] = (losses[s] ?? 0) + Math.round(v * PENALTY_FACTOR)
    }
  }
  loseXp(state, losses)
  state.streak = 0

  // Strafquest für heute
  const p = PENALTY_QUESTS[Math.floor(Math.random() * PENALTY_QUESTS.length)]
  state.quests.push({
    id: uid('q'),
    templateId: 'penalty',
    kind: 'penalty',
    title: p.title,
    desc: p.desc,
    day: today,
    dueDay: today,
    rewards: { strength: 20, vitality: 10 },
    proof: 'photo',
    status: 'open',
    required: false,
  })

  const entry = {
    day: pending.day,
    appliedAt: new Date().toISOString(),
    reason: `Verpasst: ${pending.missedTitles.join(', ')}`,
    xpLoss: losses,
  }
  state.penalties.push(entry)
  state.penaltyOverlay = entry
  state.pendingDays = state.pendingDays.filter((x) => x.day !== pending.day)
}

// ---------- Quest-Abschluss ----------

export interface CompleteOptions {
  min?: boolean
  proofText?: string
  proofPhotoId?: string
  journalEntry?: JournalEntry
  now?: Date
}

export function completeQuest(state: WRState, questId: string, opts: CompleteOptions = {}) {
  const q = state.quests.find((x) => x.id === questId)
  if (!q || (q.status !== 'open')) return
  const now = opts.now ?? new Date()
  const today = todayKey(now)

  q.status = opts.min ? 'done_min' : 'done'
  q.completedAt = now.toISOString()
  q.proofText = opts.proofText
  q.proofPhotoId = opts.proofPhotoId

  awardXp(state, q.rewards, today, opts.min ? MIN_MODE_FACTOR : 1)

  if (opts.journalEntry) state.journal.unshift(opts.journalEntry)

  if (q.templateId === 'daily_training' && !opts.min && now.getHours() < 8) {
    state.earlyTrainings += 1
  }

  pushEvent(state, {
    type: 'toast',
    message: `[SYSTEM] Quest abgeschlossen: ${q.title}`,
    detail: rewardText(q.rewards, opts.min ? MIN_MODE_FACTOR : 1),
  })

  checkHiddenQuests(state)
}

export function incrementCounter(state: WRState, questId: string, note: string) {
  const q = state.quests.find((x) => x.id === questId)
  if (!q || q.status !== 'open' || q.counterTarget == null) return
  q.counterCount = (q.counterCount ?? 0) + 1
  q.proofText = q.proofText ? `${q.proofText}\n${q.counterCount}. ${note}` : `1. ${note}`
  if (q.counterCount >= q.counterTarget) {
    completeQuest(state, questId, { proofText: q.proofText })
  } else {
    pushEvent(state, {
      type: 'toast',
      message: `[SYSTEM] Strich ${q.counterCount}/${q.counterTarget} — ${q.title}`,
    })
  }
}

export function rewardText(rewards: Partial<Record<StatId, number>>, factor = 1): string {
  return (Object.entries(rewards) as Array<[StatId, number]>)
    .map(([s, v]) => `+${Math.round(v * factor)} ${STAT_META[s].short}`)
    .join(' · ')
}

// ---------- Prognose-Auflösung ----------

export function resolveForecast(state: WRState, entryId: string, outcome: 'right' | 'wrong') {
  const e = state.journal.find((x) => x.id === entryId)
  if (!e || !e.forecast || e.forecast.resolved) return
  e.forecast.resolved = outcome
  e.forecast.resolvedAt = new Date().toISOString()
  if (outcome === 'right') {
    awardXp(state, { perception: 15 }, todayKey())
    pushEvent(state, { type: 'toast', message: '[SYSTEM] Prognose korrekt. +15 WAH', detail: 'Kalibrierung aktualisiert.' })
  } else {
    pushEvent(state, {
      type: 'toast',
      message: '[SYSTEM] Prognose falsch. Kalibrierung aktualisiert.',
      detail: 'Falsche Schlussfolgerungen sind der Wachstumsmotor.',
    })
  }
  checkHiddenQuests(state)
}

export function forecastStats(state: WRState): { resolved: number; right: number; accuracy: number } {
  const resolved = state.journal.filter((e) => e.forecast?.resolved)
  const right = resolved.filter((e) => e.forecast?.resolved === 'right')
  return {
    resolved: resolved.length,
    right: right.length,
    accuracy: resolved.length ? right.length / resolved.length : 0,
  }
}

// ---------- Hidden Quests ----------

export function checkHiddenQuests(state: WRState) {
  const has = (id: string) => state.unlocks.some((u) => u.id === id)
  const fc = forecastStats(state)
  const conditions: Record<string, boolean> = {
    hidden_streak7: state.streak >= 7,
    hidden_streak30: state.streak >= 30,
    hidden_calibration: fc.resolved >= 10 && fc.accuracy >= 0.7,
    hidden_earlybird: state.earlyTrainings >= 3,
    hidden_journal20: state.journal.filter((e) => e.kind !== 'lore').length >= 20,
    hidden_firstrank: STAT_IDS.some((s) => state.stats[s].xp >= 500),
  }
  for (const def of HIDDEN_QUESTS) {
    if (!conditions[def.id] || has(def.id)) continue
    state.unlocks.push({ id: def.id, unlockedAt: new Date().toISOString() })
    if (def.reward.xp) awardXp(state, def.reward.xp, todayKey())
    state.journal.unshift({
      id: uid('j'),
      createdAt: new Date().toISOString(),
      kind: 'lore',
      title: def.title,
      text: def.lore,
    })
    pushEvent(state, { type: 'unlock', message: def.title, detail: def.message })
  }
}
