import { useState } from 'react'
import { Modal } from '../components/Modal'
import { SysButton, SystemWindow } from '../components/SystemWindow'
import { exportBackup, exportMarkdown, KIND_LABELS } from '../domain/exporter'
import type { JournalEntry, JournalKind } from '../domain/types'
import { formatDateTime, uid } from '../lib/dates'
import { useSystemStore } from '../store/useSystemStore'

const FILTERS: Array<{ id: JournalKind | 'all'; label: string }> = [
  { id: 'all', label: 'Alle' },
  { id: 'insight', label: 'Erkenntnisse' },
  { id: 'forecast', label: 'Prognosen' },
  { id: 'postgame', label: 'Post-Game' },
  { id: 'ifthen', label: 'If-Then' },
  { id: 'metarule', label: 'Meta-Regeln' },
  { id: 'weeklyreview', label: 'Reviews' },
  { id: 'redteam', label: 'Red-Team' },
  { id: 'sparring', label: 'Sparring' },
  { id: 'lore', label: 'System-Logs' },
]

export function JournalScreen() {
  const journal = useSystemStore((s) => s.journal)
  const store = useSystemStore()
  const resolveForecastEntry = useSystemStore((s) => s.resolveForecastEntry)
  const deleteJournal = useSystemStore((s) => s.deleteJournal)
  const [filter, setFilter] = useState<JournalKind | 'all'>('all')
  const [showNew, setShowNew] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const entries = journal.filter((e) => filter === 'all' || e.kind === filter)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <SysButton onClick={() => setShowNew(true)} className="flex-1">
          + Erkenntnis
        </SysButton>
        <SysButton variant="ghost" onClick={() => exportMarkdown(store)}>
          ⬇ Markdown
        </SysButton>
        <SysButton variant="ghost" onClick={() => exportBackup(store)}>
          ⬇ Backup
        </SysButton>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
              filter === f.id ? 'border-glow/60 bg-glow/10 text-glow2' : 'border-line text-dim'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {entries.length === 0 && (
        <SystemWindow>
          <p className="py-6 text-center text-sm text-dim">
            Keine Einträge. Fehler sind Daten — fang an, sie zu sammeln.
          </p>
        </SystemWindow>
      )}

      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className={`sys-window p-3 ${e.kind === 'lore' ? 'border-gold/40' : ''}`}>
            <button className="block w-full text-left" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-widest ${
                    e.kind === 'lore' ? 'border-gold/50 text-gold' : 'border-glow/40 text-glow2'
                  }`}
                >
                  {KIND_LABELS[e.kind]}
                </span>
                <span className="text-[11px] text-dim">{formatDateTime(e.createdAt)}</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-slate-100">{e.title}</p>
              {e.forecast && (
                <p className="mt-0.5 text-xs text-dim">
                  p = {e.forecast.p} %
                  {e.forecast.resolved && (
                    <span className={e.forecast.resolved === 'right' ? 'text-emerald-300' : 'text-danger'}>
                      {' '}· {e.forecast.resolved === 'right' ? '✔ eingetreten' : '✘ nicht eingetreten'}
                    </span>
                  )}
                </p>
              )}
            </button>

            {expanded === e.id && (
              <div className="mt-2 space-y-2 border-t border-line pt-2">
                {e.fields?.map(
                  (f) =>
                    f.value.trim() && (
                      <div key={f.label}>
                        <p className="text-[11px] uppercase tracking-wider text-dim">{f.label}</p>
                        <p className="whitespace-pre-wrap text-sm text-slate-200">{f.value}</p>
                      </div>
                    ),
                )}
                {e.text && <p className="whitespace-pre-wrap text-sm italic leading-relaxed text-slate-200">{e.text}</p>}

                {e.forecast && !e.forecast.resolved && (
                  <div className="flex gap-2 pt-1">
                    <SysButton onClick={() => resolveForecastEntry(e.id, 'right')}>✔ Eingetreten</SysButton>
                    <SysButton variant="danger" onClick={() => resolveForecastEntry(e.id, 'wrong')}>
                      ✘ Nicht eingetreten
                    </SysButton>
                  </div>
                )}
                {e.kind !== 'lore' && (
                  <button
                    onClick={() => deleteJournal(e.id)}
                    className="text-[11px] text-dim underline-offset-2 hover:text-danger hover:underline"
                  >
                    Eintrag löschen
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showNew && <NewInsightDialog onClose={() => setShowNew(false)} />}
    </div>
  )
}

function NewInsightDialog({ onClose }: { onClose: () => void }) {
  const addJournal = useSystemStore((s) => s.addJournal)
  const [kind, setKind] = useState<JournalKind>('insight')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  function save() {
    const entry: JournalEntry = {
      id: uid('j'),
      createdAt: new Date().toISOString(),
      kind,
      title: title.trim() || text.trim().slice(0, 60),
      text: text.trim(),
    }
    addJournal(entry)
    onClose()
  }

  return (
    <Modal title="Neuer Eintrag" onClose={onClose}>
      <label className="mb-3 block">
        <span className="mb-1 block text-xs uppercase tracking-wider text-dim">Typ</span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as JournalKind)}
          className="w-full rounded border border-line bg-void/60 p-2 text-sm outline-none focus:border-glow"
        >
          <option value="insight">Erkenntnis</option>
          <option value="ifthen">If-Then-Regel</option>
          <option value="metarule">Meta-Regel</option>
          <option value="sparring">Sparring-Notiz</option>
        </select>
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-xs uppercase tracking-wider text-dim">Titel (optional)</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-line bg-void/60 p-2 text-sm outline-none focus:border-glow"
        />
      </label>
      <label className="mb-4 block">
        <span className="mb-1 block text-xs uppercase tracking-wider text-dim">Erkenntnis</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Was hast du gelernt? Welches Muster? Welche If-Then-Regel folgt daraus?"
          className="w-full rounded border border-line bg-void/60 p-2 text-sm outline-none focus:border-glow"
        />
      </label>
      <div className="flex justify-end gap-2">
        <SysButton variant="ghost" onClick={onClose}>Abbrechen</SysButton>
        <SysButton onClick={save} disabled={text.trim().length < 5}>Speichern</SysButton>
      </div>
    </Modal>
  )
}
