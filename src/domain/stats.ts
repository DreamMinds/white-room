import type { Rank, StatId } from './types'

export const STAT_IDS: StatId[] = [
  'vitality',
  'strength',
  'agility',
  'intelligence',
  'influence',
  'strategy',
  'perception',
]

export const STAT_META: Record<StatId, { name: string; short: string; desc: string }> = {
  vitality: {
    name: 'Vitalität',
    short: 'VIT',
    desc: 'Ernährung, Fitness, Nährstoffdeckung, frische Luft, soziale Interaktionen, Dehnen & Haltung, Regeneration & Hobbys, mentale Gesundheit.',
  },
  strength: {
    name: 'Stärke',
    short: 'STR',
    desc: 'Körperbau, Calisthenics-Skills, Griffstärke, Kampffähigkeiten, Selbstbewusstsein, Durchsetzungsvermögen, Führungsstärke, Mut, Stoizismus, mentale Härte, Resilienz.',
  },
  agility: {
    name: 'Agilität & Ausdauer',
    short: 'AGI',
    desc: 'Ausdauer, sportliche Betätigung, Reaktionsfähigkeit, Wendigkeit, Explosivkraft, Laufgeschwindigkeit.',
  },
  intelligence: {
    name: 'Intelligenz',
    short: 'INT',
    desc: 'Problemlösung, Kreativität, abstraktes Denken, Intuition, Auffassungsgabe, unabhängiges Denken, Neugier & Lernwille, Anpassungsfähigkeit, Gedächtnis, Bildung.',
  },
  influence: {
    name: 'Beeinflussung',
    short: 'BEE',
    desc: 'Psychologie-Wissen (Verhaltensökonomie, psychologische Effekte), Einfluss-Skills, Rhetorik.',
  },
  strategy: {
    name: 'Strategie',
    short: 'STG',
    desc: 'Strategisches Denken (Spieltheorie), strategische Planung, Erfahrung aus echten Zügen.',
  },
  perception: {
    name: 'Wahrnehmung',
    short: 'WAH',
    desc: 'Achtsamkeit (Situational Awareness), Blick für Details, Schlussfolgerungen, Körpersprache & Mikroexpressionen lesen.',
  },
}

export const RANKS: Rank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S']

/** kumulative XP-Schwellen pro Rang — bewusst steil, Fortschritt soll Arbeit kosten */
export const RANK_THRESHOLDS: Record<Rank, number> = {
  F: 0,
  E: 500,
  D: 1500,
  C: 3500,
  B: 7000,
  A: 12500,
  S: 20500,
}

export function rankFor(xp: number): Rank {
  let rank: Rank = 'F'
  for (const r of RANKS) {
    if (xp >= RANK_THRESHOLDS[r]) rank = r
  }
  return rank
}

/** Fortschritt innerhalb des aktuellen Rangs (0..1); S-Rang ist voll. */
export function rankProgress(xp: number): { rank: Rank; next: Rank | null; pct: number; toNext: number } {
  const rank = rankFor(xp)
  const idx = RANKS.indexOf(rank)
  if (rank === 'S') return { rank, next: null, pct: 1, toNext: 0 }
  const next = RANKS[idx + 1]
  const lo = RANK_THRESHOLDS[rank]
  const hi = RANK_THRESHOLDS[next]
  return { rank, next, pct: (xp - lo) / (hi - lo), toNext: hi - xp }
}

/** Spieler-Level aus Gesamt-XP: quadratische Kurve, Level-Ups werden stetig teurer. */
export function levelFor(totalXp: number): number {
  return 1 + Math.floor(Math.sqrt(totalXp / 60))
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 60
}

export const TITLES: Array<{ level: number; title: string }> = [
  { level: 1, title: 'Der Erwachte' },
  { level: 5, title: 'E-Rang Jäger' },
  { level: 10, title: 'D-Rang Jäger' },
  { level: 16, title: 'C-Rang Jäger' },
  { level: 24, title: 'B-Rang Jäger' },
  { level: 34, title: 'A-Rang Jäger' },
  { level: 46, title: 'S-Rang Jäger' },
  { level: 60, title: 'Monarch der Disziplin' },
]

export function titleFor(level: number): string {
  let t = TITLES[0].title
  for (const e of TITLES) if (level >= e.level) t = e.title
  return t
}

/** Decay: ab Tag 4 ohne Aktivität verliert ein Stat XP, täglich steigend (10, 20, 30 … max 60). */
export function decayForInactiveDays(daysInactive: number): number {
  if (daysInactive <= 3) return 0
  return Math.min(60, (daysInactive - 3) * 10)
}
