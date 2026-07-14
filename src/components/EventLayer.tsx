import { useEffect } from 'react'
import { useSystemStore } from '../store/useSystemStore'
import { Modal } from './Modal'
import { SysButton } from './SystemWindow'

/** Rendert System-Events: Toasts (auto-dismiss) + Level-Up/Rank-Up/Unlock-Fenster. */
export function EventLayer() {
  const events = useSystemStore((s) => s.events)
  const consume = useSystemStore((s) => s.consumeEvent)

  const toast = events.find((e) => e.type === 'toast')
  const big = events.find((e) => e.type !== 'toast')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => consume(toast.id), 3500)
    return () => clearTimeout(t)
  }, [toast, consume])

  return (
    <>
      {toast && (
        <div className="fixed top-3 left-1/2 z-[60] w-[92%] max-w-md -translate-x-1/2">
          <div className="sys-window anim-rise px-4 py-2.5 text-sm">
            <p className="font-semibold text-glow2">{toast.message}</p>
            {toast.detail && <p className="text-xs text-dim">{toast.detail}</p>}
          </div>
        </div>
      )}

      {big && (
        <Modal
          title={big.type === 'levelup' ? 'LEVEL UP' : big.type === 'rankup' ? 'RANG-AUFSTIEG' : 'GEHEIME QUEST'}
          onClose={() => consume(big.id)}
        >
          <div className="py-4 text-center">
            <p className="anim-pulse-glow glow-text mx-auto mb-4 inline-block rounded border border-glow/50 px-6 py-3 text-2xl font-black tracking-[0.2em]">
              {big.type === 'unlock' ? '✦' : '▲'} {big.type === 'levelup' ? big.detail : big.message}
            </p>
            {big.type !== 'levelup' && big.detail && <p className="mb-4 text-sm text-slate-200">{big.detail}</p>}
            {big.type === 'unlock' && (
              <p className="mb-4 text-xs italic text-dim">Ein neuer Eintrag wurde im Journal hinterlegt (System-Log).</p>
            )}
            <SysButton onClick={() => consume(big.id)}>Bestätigen</SysButton>
          </div>
        </Modal>
      )}
    </>
  )
}
