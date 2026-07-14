import type { JournalEntry, JournalKind } from './types'
import type { WRState } from '../store/state'
import { STAT_IDS, STAT_META, rankFor } from './stats'
import { formatDateTime } from '../lib/dates'

export const KIND_LABELS: Record<JournalKind, string> = {
  insight: 'Erkenntnis',
  forecast: 'Prognose',
  postgame: 'Post-Game',
  ifthen: 'If-Then-Regel',
  metarule: 'Meta-Regel',
  weeklyreview: 'Weekly Review',
  redteam: 'Red-Team',
  sparring: 'Sparring',
  model: 'Modell der Woche',
  psych: 'Psychologie-Effekt',
  uncomfortable: 'Unangenehme Situation',
  lore: 'System-Log',
}

function entryToMarkdown(e: JournalEntry): string {
  let md = `### ${e.title}\n\n*${KIND_LABELS[e.kind]} · ${formatDateTime(e.createdAt)}*\n\n`
  if (e.forecast) {
    md += `**Wahrscheinlichkeit:** ${e.forecast.p} %`
    if (e.forecast.resolved) md += ` · **Ergebnis:** ${e.forecast.resolved === 'right' ? '✔ eingetreten' : '✘ nicht eingetreten'}`
    md += '\n\n'
  }
  if (e.fields?.length) {
    for (const f of e.fields) {
      if (f.value.trim()) md += `**${f.label}**\n${f.value.trim()}\n\n`
    }
  }
  if (e.text?.trim()) md += `${e.text.trim()}\n\n`
  return md
}

export function journalToMarkdown(state: WRState): string {
  let md = `# White Room 2.0 — Journal-Export\n\nExportiert: ${formatDateTime(new Date().toISOString())}\n\n`
  md += `## Status\n\n| Stat | Rang | XP |\n| --- | --- | --- |\n`
  for (const s of STAT_IDS) {
    md += `| ${STAT_META[s].name} | ${rankFor(state.stats[s].xp)} | ${state.stats[s].xp} |\n`
  }
  md += `\nStreak: ${state.streak} Tage (Bestwert: ${state.bestStreak})\n\n`

  const kinds = Object.keys(KIND_LABELS) as JournalKind[]
  for (const kind of kinds) {
    const entries = state.journal.filter((e) => e.kind === kind)
    if (!entries.length) continue
    md += `## ${KIND_LABELS[kind]} (${entries.length})\n\n`
    for (const e of [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      md += entryToMarkdown(e)
    }
  }
  return md
}

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportMarkdown(state: WRState) {
  const day = new Date().toISOString().slice(0, 10)
  download(`wr-journal-${day}.md`, journalToMarkdown(state), 'text/markdown')
}

export function exportBackup(state: WRState) {
  const day = new Date().toISOString().slice(0, 10)
  const { events: _e, penaltyOverlay: _p, ...data } = state
  download(`wr-backup-${day}.json`, JSON.stringify(data, null, 2), 'application/json')
}
