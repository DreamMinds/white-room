import { jokersLeft } from '../domain/engine'
import { useSystemStore } from '../store/useSystemStore'
import { formatDay } from '../lib/dates'
import { Modal } from './Modal'
import { SysButton } from './SystemWindow'

/** Erscheint beim App-Start, wenn ein vergangener Tag Pflicht-Quests offen hatte. */
export function JokerDialog() {
  const pending = useSystemStore((s) => s.pendingDays)
  const joker = useSystemStore((s) => s.joker)
  const spendJoker = useSystemStore((s) => s.useJoker)
  const acceptPenalty = useSystemStore((s) => s.acceptPenalty)

  if (pending.length === 0) return null
  const day = pending[0]
  const left = jokersLeft({ joker } as Parameters<typeof jokersLeft>[0])

  return (
    <Modal title="[SYSTEM] Tagesprüfung fehlgeschlagen" closable={false}>
      <p className="mb-1 text-sm text-slate-200">
        Am <span className="font-bold text-glow2">{formatDay(day.day)}</span> wurden Pflicht-Quests nicht erfüllt:
      </p>
      <ul className="mb-4 list-inside list-disc text-sm text-dim">
        {day.missedTitles.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-dim">Joker diesen Monat:</span>
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold ${
              i < left ? 'border-gold text-gold shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'border-line text-line line-through'
            }`}
          >
            ◆
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <SysButton variant="gold" disabled={left <= 0} onClick={() => spendJoker(day)}>
          {left > 0 ? `Joker einsetzen (${left} übrig)` : 'Keine Joker mehr'}
        </SysButton>
        <SysButton variant="danger" onClick={() => acceptPenalty(day)}>
          Strafe akzeptieren
        </SysButton>
      </div>
      <p className="mt-3 text-center text-xs italic text-dim">
        Ein Joker friert den Streak ein. Eine Strafe setzt ihn auf 0 — und das System vergisst nicht.
      </p>
    </Modal>
  )
}
