export type StatId =
  | 'vitality'
  | 'strength'
  | 'agility'
  | 'intelligence'
  | 'influence'
  | 'strategy'
  | 'perception'

export type Rank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S'

export interface StatState {
  xp: number
  /** letzter Tag (YYYY-MM-DD), an dem der Stat XP bekommen hat — Basis für Decay */
  lastActivity: string
  /** höchste je erreichte XP — bestimmt den Rang-Boden (Ratchet), s. floorXpFor */
  peakXp: number
}

export type QuestKind = 'daily' | 'weekly' | 'penalty' | 'hidden' | 'boss'
export type ProofKind = 'photo' | 'text' | 'form' | 'counter' | 'none'
export type FormKind =
  | 'forecast'
  | 'postgame'
  | 'redteam'
  | 'sparring'
  | 'weeklyreview'
  | 'model'
  | 'psych'
  | 'uncomfortable'

export type QuestStatus = 'open' | 'done' | 'done_min' | 'failed' | 'joker'

export interface QuestInstance {
  id: string
  templateId: string
  kind: QuestKind
  title: string
  desc: string
  /** Tag (daily/penalty) bzw. erster Tag der Periode */
  day: string
  /** ISO-Woche für weekly, Quartal für boss */
  period?: string
  /** Tag, an dem die Quest spätestens erledigt sein muss */
  dueDay: string
  rewards: Partial<Record<StatId, number>>
  proof: ProofKind
  formKind?: FormKind
  counterTarget?: number
  counterCount?: number
  /** Minimum-Modus erlaubt ("lieber 5 Min als gar nicht") */
  minAllowed?: boolean
  /** zählt für Tages-Streak & Strafsystem */
  required?: boolean
  status: QuestStatus
  completedAt?: string
  proofText?: string
  proofPhotoId?: string
}

export type JournalKind =
  | 'insight'
  | 'forecast'
  | 'postgame'
  | 'ifthen'
  | 'metarule'
  | 'weeklyreview'
  | 'redteam'
  | 'sparring'
  | 'model'
  | 'psych'
  | 'uncomfortable'
  | 'lore'

export interface ForecastData {
  p: number
  resolved?: 'right' | 'wrong'
  resolvedAt?: string
}

export interface JournalEntry {
  id: string
  createdAt: string
  kind: JournalKind
  title: string
  /** strukturierte Formularfelder (Frage → Antwort) */
  fields?: Array<{ label: string; value: string }>
  text?: string
  forecast?: ForecastData
  questId?: string
}

export interface JokerState {
  month: string
  used: number
  log: Array<{ day: string; usedAt: string; reason: string }>
}

export interface PenaltyLogEntry {
  day: string
  appliedAt: string
  reason: string
  xpLoss: Partial<Record<StatId, number>>
}

export interface PendingDay {
  day: string
  missedTitles: string[]
  missedQuestIds: string[]
}

export interface UnlockState {
  id: string
  unlockedAt: string
}

export interface TrainingDay {
  title: string
  desc: string
  rewards: Partial<Record<StatId, number>>
}

export interface Settings {
  claudeUrl: string
  /** Stunde, zu der der Tag endet (Deadline), Standard 23 → 23:59 */
  warnHoursBefore: number
  notificationsEnabled: boolean
  theme: 'system' | 'monarch'
  playerName: string
  trainingPlan: TrainingDay[] // Index 0=Mo … 6=So
}

export interface SystemEvent {
  id: string
  type: 'toast' | 'levelup' | 'rankup' | 'unlock'
  message: string
  detail?: string
}
