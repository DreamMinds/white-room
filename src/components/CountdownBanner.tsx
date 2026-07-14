import { useEffect, useState } from 'react'
import { todayKey } from '../lib/dates'
import { useSystemStore } from '../store/useSystemStore'

/** Warnbanner am Abend, solange Pflicht-Quests offen sind. Deadline: 23:59 lokal. */
export function CountdownBanner() {
  const quests = useSystemStore((s) => s.quests)
  const warnHours = useSystemStore((s) => s.settings.warnHoursBefore)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const today = todayKey(now)
  const openRequired = quests.filter((q) => q.kind === 'daily' && q.day === today && q.required && q.status === 'open')
  if (openRequired.length === 0) return null

  const deadline = new Date(now)
  deadline.setHours(23, 59, 59, 0)
  const msLeft = deadline.getTime() - now.getTime()
  if (msLeft > warnHours * 3600000) return null

  const h = Math.floor(msLeft / 3600000)
  const m = Math.floor((msLeft % 3600000) / 60000)

  return (
    <div className="anim-flicker mb-3 rounded border border-danger/70 bg-danger/10 px-3 py-2 text-sm shadow-[0_0_16px_rgba(244,63,94,0.25)]">
      <p className="font-bold tracking-widest text-danger">
        ⚠ [SYSTEM-WARNUNG] {h}h {String(m).padStart(2, '0')}m verbleibend
      </p>
      <p className="text-xs text-rose-200">
        {openRequired.length} Pflicht-Quest{openRequired.length > 1 ? 's' : ''} offen. Bei Nichterfüllung droht eine Sanktion.
      </p>
    </div>
  )
}
