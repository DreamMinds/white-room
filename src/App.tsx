import { useEffect, useRef, useState } from 'react'
import { BottomNav, type Screen } from './components/BottomNav'
import { EventLayer } from './components/EventLayer'
import { JokerDialog } from './components/JokerDialog'
import { PenaltyOverlay } from './components/PenaltyOverlay'
import { todayKey } from './lib/dates'
import { CodexScreen } from './screens/Codex'
import { JournalScreen } from './screens/Journal'
import { QuestsScreen } from './screens/Quests'
import { StatusScreen } from './screens/Status'
import { SystemScreen } from './screens/SystemScreen'
import { useSystemStore } from './store/useSystemStore'

export default function App() {
  const [screen, setScreen] = useState<Screen>('status')
  const rollover = useSystemStore((s) => s.rollover)
  const theme = useSystemStore((s) => s.settings.theme)
  const quests = useSystemStore((s) => s.quests)
  const settings = useSystemStore((s) => s.settings)
  const notifiedDay = useRef<string>('')

  // Rollover: beim Start, bei Rückkehr in den Tab und bei Tageswechsel
  useEffect(() => {
    rollover()
    const onVisible = () => document.visibilityState === 'visible' && rollover()
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(rollover, 60000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
    }
  }, [rollover])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Abend-Warnung als Browser-Notification (einmal pro Tag, solange App offen)
  useEffect(() => {
    if (!settings.notificationsEnabled || !('Notification' in window)) return
    const check = () => {
      const now = new Date()
      const today = todayKey(now)
      if (notifiedDay.current === today) return
      const deadline = new Date(now)
      deadline.setHours(23, 59, 59, 0)
      const msLeft = deadline.getTime() - now.getTime()
      const openRequired = useSystemStore
        .getState()
        .quests.filter((q) => q.kind === 'daily' && q.day === today && q.required && q.status === 'open')
      if (msLeft <= settings.warnHoursBefore * 3600000 && openRequired.length > 0 && Notification.permission === 'granted') {
        notifiedDay.current = today
        new Notification('⚠ [SYSTEM-WARNUNG]', {
          body: `${openRequired.length} Pflicht-Quest(s) offen. Zeit läuft ab — Sanktion droht.`,
        })
      }
    }
    check()
    const t = setInterval(check, 5 * 60000)
    return () => clearInterval(t)
  }, [settings.notificationsEnabled, settings.warnHoursBefore])

  const today = todayKey()
  const openToday = quests.filter(
    (q) => (q.kind === 'daily' || q.kind === 'penalty') && q.day === today && q.status === 'open',
  ).length

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-3 pt-4 pb-24">
      <header className="mb-4 text-center">
        <h1 className="sys-title anim-flicker text-lg uppercase">⬢ White Room 2.0</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-dim">System Interface</p>
      </header>

      {screen === 'status' && <StatusScreen />}
      {screen === 'quests' && <QuestsScreen />}
      {screen === 'journal' && <JournalScreen />}
      {screen === 'codex' && <CodexScreen />}
      {screen === 'system' && <SystemScreen />}

      <BottomNav active={screen} onNavigate={setScreen} questBadge={openToday} />
      <JokerDialog />
      <PenaltyOverlay />
      <EventLayer />
    </div>
  )
}
