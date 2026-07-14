import type {
  JokerState,
  JournalEntry,
  PendingDay,
  PenaltyLogEntry,
  QuestInstance,
  Settings,
  StatId,
  StatState,
  SystemEvent,
  UnlockState,
} from '../domain/types'
import { STAT_IDS } from '../domain/stats'
import { DEFAULT_TRAINING_PLAN } from '../data/seed'
import { monthKey, todayKey } from '../lib/dates'

export interface WRState {
  stats: Record<StatId, StatState>
  quests: QuestInstance[]
  journal: JournalEntry[]
  joker: JokerState
  penalties: PenaltyLogEntry[]
  pendingDays: PendingDay[]
  unlocks: UnlockState[]
  settings: Settings
  streak: number
  bestStreak: number
  lastProcessedDay: string
  earlyTrainings: number
  penaltyOverlay: PenaltyLogEntry | null
  events: SystemEvent[]
  createdAt: string
}

export function initialState(): WRState {
  const today = todayKey()
  const stats = {} as Record<StatId, StatState>
  for (const s of STAT_IDS) stats[s] = { xp: 0, lastActivity: today }
  return {
    stats,
    quests: [],
    journal: [],
    joker: { month: monthKey(today), used: 0, log: [] },
    penalties: [],
    pendingDays: [],
    unlocks: [],
    settings: {
      claudeUrl: '',
      warnHoursBefore: 3,
      notificationsEnabled: false,
      theme: 'system',
      playerName: 'Spieler',
      trainingPlan: DEFAULT_TRAINING_PLAN,
    },
    streak: 0,
    bestStreak: 0,
    lastProcessedDay: '',
    earlyTrainings: 0,
    penaltyOverlay: null,
    events: [],
    createdAt: new Date().toISOString(),
  }
}
