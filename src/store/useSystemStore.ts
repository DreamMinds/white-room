import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { JournalEntry, PendingDay, Settings } from '../domain/types'
import {
  completeQuest,
  incrementCounter,
  processRollover,
  resolveDayWithJoker,
  resolveDayWithPenalty,
  resolveForecast,
  type CompleteOptions,
} from '../domain/engine'
import { initialState, type WRState } from './state'
import { DEFAULT_TRAINING_PLAN } from '../data/seed'

/**
 * v1→v2: Rang-Boden eingeführt — peakXp pro Stat backfillen (= aktuelle XP).
 * v2→v3: Trainingsplan-Rework (5+1+1 mit Ruhetag) — die bei Erststart eingefrorene Kopie in
 * settings.trainingPlan wird durch den neuen DEFAULT_TRAINING_PLAN ersetzt (keine Custom-UI → sicher).
 */
export function migratePersisted(s: WRState, version: number): WRState {
  if (version < 2 && s?.stats) {
    for (const stat of Object.values(s.stats)) {
      stat.peakXp = Math.max(stat.peakXp ?? 0, stat.xp ?? 0)
    }
  }
  if (version < 3 && s?.settings) {
    s.settings.trainingPlan = DEFAULT_TRAINING_PLAN
  }
  return s
}

interface Actions {
  rollover: () => void
  complete: (questId: string, opts?: CompleteOptions) => void
  tally: (questId: string, note: string) => void
  useJoker: (pending: PendingDay) => void
  acceptPenalty: (pending: PendingDay) => void
  dismissPenaltyOverlay: () => void
  addJournal: (entry: JournalEntry) => void
  deleteJournal: (id: string) => void
  resolveForecastEntry: (id: string, outcome: 'right' | 'wrong') => void
  updateSettings: (patch: Partial<Settings>) => void
  consumeEvent: (id: string) => void
  importState: (data: WRState) => void
  resetAll: () => void
}

export type SystemStore = WRState & Actions

export const useSystemStore = create<SystemStore>()(
  persist(
    immer((set) => ({
      ...initialState(),

      rollover: () => set((s) => processRollover(s)),
      complete: (questId, opts) => set((s) => completeQuest(s, questId, opts)),
      tally: (questId, note) => set((s) => incrementCounter(s, questId, note)),
      useJoker: (pending) => set((s) => resolveDayWithJoker(s, pending)),
      acceptPenalty: (pending) => set((s) => resolveDayWithPenalty(s, pending)),
      dismissPenaltyOverlay: () =>
        set((s) => {
          s.penaltyOverlay = null
        }),
      addJournal: (entry) =>
        set((s) => {
          s.journal.unshift(entry)
        }),
      deleteJournal: (id) =>
        set((s) => {
          s.journal = s.journal.filter((e) => e.id !== id)
        }),
      resolveForecastEntry: (id, outcome) => set((s) => resolveForecast(s, id, outcome)),
      updateSettings: (patch) =>
        set((s) => {
          Object.assign(s.settings, patch)
        }),
      consumeEvent: (id) =>
        set((s) => {
          s.events = s.events.filter((e) => e.id !== id)
        }),
      importState: (data) =>
        set(() => ({ ...data, events: [], penaltyOverlay: null })),
      resetAll: () => set(() => initialState()),
    })),
    {
      name: 'wr-system-v1',
      version: 3,
      migrate: (persisted, version) => migratePersisted(persisted as WRState, version) as SystemStore,
      partialize: (s) => {
        // transiente UI-Events nicht persistieren
        const { events: _events, ...rest } = s
        return { ...rest, events: [] } as SystemStore
      },
    },
  ),
)
