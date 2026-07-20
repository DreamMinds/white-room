import { useState } from 'react'
import { rewardText } from '../domain/engine'
import type { QuestInstance } from '../domain/types'
import { formatDay, todayKey } from '../lib/dates'
import { useSystemStore } from '../store/useSystemStore'
import { FormDialog, TallyDialog } from './FormDialog'
import { ProofDialog } from './ProofDialog'
import { SysButton } from './SystemWindow'

const KIND_TAG: Record<QuestInstance['kind'], { label: string; cls: string }> = {
  daily: { label: 'DAILY', cls: 'text-glow2 border-glow/50' },
  weekly: { label: 'WEEKLY', cls: 'text-emerald-300 border-emerald-400/50' },
  monthly: { label: 'MONTHLY', cls: 'text-violet-300 border-violet-400/50' },
  campaign: { label: 'KAMPAGNE', cls: 'text-amber-300 border-amber-400/50' },
  penalty: { label: 'STRAFE', cls: 'text-danger border-danger/60' },
  hidden: { label: '???', cls: 'text-gold border-gold/50' },
  boss: { label: 'BOSS', cls: 'text-gold border-gold/60' },
}

export function QuestCard({ quest }: { quest: QuestInstance }) {
  const complete = useSystemStore((s) => s.complete)
  const [dialog, setDialog] = useState<'proof' | 'proof_min' | 'form' | 'tally' | null>(null)

  const open = quest.status === 'open'
  const tag = KIND_TAG[quest.kind]
  const done = quest.status === 'done' || quest.status === 'done_min'
  const today = todayKey()

  const statusText =
    quest.status === 'done' ? '✔ ABGESCHLOSSEN'
    : quest.status === 'done_min' ? '✔ MINIMUM (25 % XP)'
    : quest.status === 'failed' ? '✘ FEHLGESCHLAGEN'
    : quest.status === 'joker' ? '◆ JOKER EINGESETZT'
    : null

  return (
    <div
      className={`sys-window p-3 ${quest.kind === 'penalty' && open ? 'anim-pulse-glow border-danger/70' : ''} ${!open ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-widest ${tag.cls}`}>
              {tag.label}
            </span>
            {quest.dueDay !== today && open && (
              <span className="text-[10px] uppercase tracking-wider text-dim">bis {formatDay(quest.dueDay)}</span>
            )}
          </div>
          <p className={`font-semibold ${quest.kind === 'penalty' ? 'text-danger' : 'text-slate-100'}`}>{quest.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-dim">{quest.desc}</p>
          <p className="mt-1 text-xs font-semibold text-glow2">{rewardText(quest.rewards)}</p>
        </div>
      </div>

      {statusText && (
        <p className={`mt-2 text-xs font-bold tracking-widest ${done ? 'text-emerald-300' : quest.status === 'failed' ? 'text-danger' : 'text-gold'}`}>
          {statusText}
        </p>
      )}

      {open && (
        <div className="mt-3 flex flex-wrap gap-2">
          {quest.proof === 'photo' && (
            <>
              <SysButton onClick={() => setDialog('proof')}>Abschließen</SysButton>
              {quest.minAllowed && (
                <SysButton variant="gold" onClick={() => setDialog('proof_min')}>
                  Minimum (5 Min)
                </SysButton>
              )}
            </>
          )}
          {quest.proof === 'form' && <SysButton onClick={() => setDialog('form')}>Ausfüllen</SysButton>}
          {quest.proof === 'counter' && (
            <SysButton onClick={() => setDialog('tally')}>
              Strichliste {quest.counterCount ?? 0}/{quest.counterTarget}
            </SysButton>
          )}
          {quest.proof === 'text' && <SysButton onClick={() => setDialog('proof')}>Abschließen</SysButton>}
        </div>
      )}

      {(dialog === 'proof' || dialog === 'proof_min') && (
        <ProofDialog
          quest={quest}
          min={dialog === 'proof_min'}
          onClose={() => setDialog(null)}
          onSubmit={(opts) => {
            complete(quest.id, opts)
            setDialog(null)
          }}
        />
      )}
      {dialog === 'form' && <FormDialog quest={quest} onClose={() => setDialog(null)} />}
      {dialog === 'tally' && <TallyDialog quest={quest} onClose={() => setDialog(null)} />}
    </div>
  )
}
