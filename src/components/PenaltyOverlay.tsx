import { useSystemStore } from '../store/useSystemStore'
import { STAT_META } from '../domain/stats'
import type { StatId } from '../domain/types'
import { SysButton } from './SystemWindow'

/** Vollbild-„SYSTEMFEHLER" nach einer Strafe — im Stil einer korrupten System-Meldung. */
export function PenaltyOverlay() {
  const penalty = useSystemStore((s) => s.penaltyOverlay)
  const dismiss = useSystemStore((s) => s.dismissPenaltyOverlay)
  if (!penalty) return null

  return (
    <div className="penalty-overlay fixed inset-0 z-[70] flex items-center justify-center p-6">
      <div className="anim-flicker w-full max-w-md border border-danger/70 bg-black/60 p-6 text-center shadow-[0_0_60px_rgba(244,63,94,0.35)]">
        <p className="anim-glitch mb-4 text-xl font-black tracking-[0.25em] text-danger sm:text-2xl">
          ⚠ SYSTEMFEHLER
        </p>
        <p className="mb-1 font-mono2 text-xs uppercase tracking-widest text-danger/80">
          Pflicht-Quest nicht erfüllt — {penalty.day}
        </p>
        <p className="mb-4 text-sm text-rose-200">{penalty.reason}</p>

        <div className="mb-4 border-t border-b border-danger/40 py-3 text-left text-sm">
          <p className="mb-2 text-xs uppercase tracking-widest text-danger/80">Verhängte Sanktionen</p>
          <ul className="space-y-1 text-rose-100">
            {(Object.entries(penalty.xpLoss) as Array<[StatId, number]>).map(([s, v]) => (
              <li key={s}>− {v} XP {STAT_META[s].name}</li>
            ))}
            <li>Streak zurückgesetzt auf 0</li>
            <li>Strafquest für heute aktiviert</li>
          </ul>
        </div>

        <p className="mb-5 text-xs italic text-rose-300/70">
          „Das Gehirn wählt den Weg des geringsten Widerstands. Das System nicht."
        </p>
        <SysButton variant="danger" onClick={dismiss} className="w-full">
          Sanktion akzeptieren
        </SysButton>
      </div>
    </div>
  )
}
