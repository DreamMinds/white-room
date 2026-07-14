import { useMemo, useState } from 'react'
import {
  MODEL_LIBRARY,
  POSTGAME_QUESTIONS,
  PSYCH_EFFECTS,
  PSYCH_QUESTIONS,
  REDTEAM_QUESTIONS,
  SPARRING_QUESTIONS,
  UNCOMFORTABLE_QUESTIONS,
  WEEKLYREVIEW_QUESTIONS,
} from '../data/seed'
import type { FormKind, JournalEntry, JournalKind, QuestInstance } from '../domain/types'
import { uid } from '../lib/dates'
import { useSystemStore } from '../store/useSystemStore'
import { Modal } from './Modal'
import { SysButton } from './SystemWindow'

const FORM_CONFIG: Record<
  Exclude<FormKind, 'forecast' | 'model'>,
  { questions: string[]; journalKind: JournalKind; titlePrefix: string }
> = {
  postgame: { questions: POSTGAME_QUESTIONS, journalKind: 'postgame', titlePrefix: 'Post-Game' },
  weeklyreview: { questions: WEEKLYREVIEW_QUESTIONS, journalKind: 'weeklyreview', titlePrefix: 'Weekly Review' },
  redteam: { questions: REDTEAM_QUESTIONS, journalKind: 'redteam', titlePrefix: 'Red-Team' },
  sparring: { questions: SPARRING_QUESTIONS, journalKind: 'sparring', titlePrefix: 'Sparring' },
  psych: { questions: PSYCH_QUESTIONS, journalKind: 'psych', titlePrefix: 'Psych-Effekt' },
  uncomfortable: { questions: UNCOMFORTABLE_QUESTIONS, journalKind: 'uncomfortable', titlePrefix: 'Unangenehme Situation' },
}

/** Formular-Quests: Antworten werden Proof UND Journal-Eintrag zugleich. */
export function FormDialog({ quest, onClose }: { quest: QuestInstance; onClose: () => void }) {
  const complete = useSystemStore((s) => s.complete)
  const addJournal = useSystemStore((s) => s.addJournal)
  const claudeUrl = useSystemStore((s) => s.settings.claudeUrl)

  const isForecast = quest.formKind === 'forecast'
  const cfg = !isForecast ? FORM_CONFIG[quest.formKind as keyof typeof FORM_CONFIG] : null
  const questions = useMemo(() => (isForecast ? [] : cfg?.questions ?? []), [isForecast, cfg])

  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''))
  const [what, setWhat] = useState('')
  const [why, setWhy] = useState('')
  const [p, setP] = useState(65)

  const totalLen = answers.join('').trim().length
  const valid = isForecast ? what.trim().length >= 10 && why.trim().length >= 10 : totalLen >= 40

  function submit() {
    const now = new Date().toISOString()
    let entry: JournalEntry
    if (isForecast) {
      entry = {
        id: uid('j'),
        createdAt: now,
        kind: 'forecast',
        title: what.trim().slice(0, 80),
        fields: [
          { label: 'Was wird passieren?', value: what.trim() },
          { label: 'Warum (Kausalkette)?', value: why.trim() },
        ],
        forecast: { p },
        questId: quest.id,
      }
    } else {
      entry = {
        id: uid('j'),
        createdAt: now,
        kind: cfg!.journalKind,
        title: `${cfg!.titlePrefix} — ${answers[0]?.trim().slice(0, 60) || quest.title}`,
        fields: questions.map((q, i) => ({ label: q, value: answers[i].trim() })),
        questId: quest.id,
      }
    }
    complete(quest.id, { proofText: 'Formular ausgefüllt → Journal', journalEntry: entry })

    // Post-Game: If-Then-Regel zusätzlich als eigenen Eintrag speichern
    if (quest.formKind === 'postgame') {
      const ifThen = answers[5]?.trim()
      if (ifThen && ifThen.length >= 10) {
        addJournal({
          id: uid('j'),
          createdAt: now,
          kind: 'ifthen',
          title: ifThen.slice(0, 80),
          text: ifThen,
        })
      }
    }
    // Weekly Review: Meta-Regel zusätzlich extrahieren
    if (quest.formKind === 'weeklyreview') {
      const meta = answers[1]?.trim()
      if (meta && meta.length >= 10) {
        addJournal({ id: uid('j'), createdAt: now, kind: 'metarule', title: meta.slice(0, 80), text: meta })
      }
    }
    onClose()
  }

  return (
    <Modal title={quest.title} onClose={onClose}>
      <p className="mb-3 text-xs text-dim">{quest.desc}</p>

      {quest.formKind === 'sparring' && claudeUrl && (
        <a
          href={claudeUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-3 block rounded border border-glow/50 bg-glow/10 px-3 py-2 text-center text-sm font-semibold uppercase tracking-wide text-glow2 hover:bg-glow/20"
        >
          ▶ Sparring im Claude-Projekt starten (Format D)
        </a>
      )}
      {quest.formKind === 'psych' && (
        <p className="mb-3 text-xs text-dim">
          Kandidaten: {PSYCH_EFFECTS.slice(0, 8).join(' · ')} …
        </p>
      )}

      {isForecast ? (
        <>
          <Field label={'Was wird passieren? (Move + Response: „Wenn ich X tue, passiert Y bis Z“)'}>
            <textarea value={what} onChange={(e) => setWhat(e.target.value)} rows={2} className={inputCls} />
          </Field>
          <Field label={`Wahrscheinlichkeit: ${p} % — nicht in 50/50 flüchten`}>
            <input
              type="range"
              min={5}
              max={95}
              step={5}
              value={p}
              onChange={(e) => setP(Number(e.target.value))}
              className="w-full accent-(--color-glow)"
            />
          </Field>
          <Field label="Warum? (Kausalkette)">
            <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={2} className={inputCls} />
          </Field>
        </>
      ) : (
        questions.map((q, i) => (
          <Field key={i} label={q}>
            <textarea
              value={answers[i]}
              onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))}
              rows={2}
              className={inputCls}
            />
          </Field>
        ))
      )}

      {!valid && (
        <p className="mb-2 text-xs text-danger/80">
          Mindest-Eintrag erforderlich — ein leeres Formular ist kein Proof of Work.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <SysButton variant="ghost" onClick={onClose}>Abbrechen</SysButton>
        <SysButton onClick={submit} disabled={!valid}>Abschließen → Journal</SysButton>
      </div>
    </Modal>
  )
}

const inputCls = 'w-full rounded border border-line bg-void/60 p-2 text-sm outline-none focus:border-glow'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-dim">{label}</span>
      {children}
    </label>
  )
}

/** Tally-Dialog für die Strichlisten-Quest (Modell der Woche). */
export function TallyDialog({ quest, onClose }: { quest: QuestInstance; onClose: () => void }) {
  const tally = useSystemStore((s) => s.tally)
  const [note, setNote] = useState('')
  const count = quest.counterCount ?? 0
  const target = quest.counterTarget ?? 5

  return (
    <Modal title={quest.title} onClose={onClose}>
      <p className="mb-2 text-xs text-dim">{quest.desc}</p>
      <p className="mb-3 text-xs text-dim">
        Modell-Bibliothek: {MODEL_LIBRARY.map((m) => m.name).join(' · ')}
      </p>
      <div className="mb-3 flex items-center gap-2">
        {Array.from({ length: target }).map((_, i) => (
          <span
            key={i}
            className={`inline-block h-6 w-3 rounded-sm border ${i < count ? 'border-glow bg-glow/60' : 'border-line'}`}
          />
        ))}
        <span className="ml-2 text-sm text-glow2">{count}/{target}</span>
      </div>
      {quest.proofText && (
        <pre className="mb-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded border border-line bg-void/50 p-2 text-xs text-dim">
          {quest.proofText}
        </pre>
      )}
      <Field label="Anwendung in einem Satz (Modell + Situation)">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputCls} />
      </Field>
      <div className="flex justify-end gap-2">
        <SysButton variant="ghost" onClick={onClose}>Schließen</SysButton>
        <SysButton
          disabled={note.trim().length < 10}
          onClick={() => {
            tally(quest.id, note.trim())
            setNote('')
            if (count + 1 >= target) onClose()
          }}
        >
          Strich +1
        </SysButton>
      </div>
    </Modal>
  )
}
