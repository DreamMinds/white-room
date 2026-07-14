import { useState } from 'react'
import { CountdownBanner } from '../components/CountdownBanner'
import { QuestCard } from '../components/QuestCard'
import { SystemWindow } from '../components/SystemWindow'
import { HIDDEN_QUESTS } from '../data/seed'
import { formatDay, todayKey, weekKey } from '../lib/dates'
import { useSystemStore } from '../store/useSystemStore'

type Tab = 'today' | 'week' | 'special'

export function QuestsScreen() {
  const quests = useSystemStore((s) => s.quests)
  const unlocks = useSystemStore((s) => s.unlocks)
  const claudeUrl = useSystemStore((s) => s.settings.claudeUrl)
  const [tab, setTab] = useState<Tab>('today')

  const today = todayKey()
  const week = weekKey(today)

  const daily = quests.filter((q) => (q.kind === 'daily' || q.kind === 'penalty') && q.day === today)
  const weekly = quests.filter((q) => q.kind === 'weekly' && q.period === week)
  const boss = quests.filter((q) => q.kind === 'boss' && q.status === 'open')

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'today', label: `Heute (${daily.filter((q) => q.status === 'open').length})` },
    { id: 'week', label: `Woche (${weekly.filter((q) => q.status === 'open').length})` },
    { id: 'special', label: '???' },
  ]

  return (
    <div className="space-y-4">
      <CountdownBanner />

      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded border px-2 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === t.id ? 'border-glow/60 bg-glow/10 text-glow2' : 'border-line text-dim hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-dim">{formatDay(today)} — Daily Quests</p>
          {daily.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
          {claudeUrl && (
            <a
              href={claudeUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded border border-line px-3 py-2 text-center text-xs font-semibold uppercase tracking-widest text-dim hover:border-glow/50 hover:text-glow2"
            >
              ▶ Claude-Sparringspartner öffnen
            </a>
          )}
        </div>
      )}

      {tab === 'week' && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-dim">Woche {week} — Deadline Sonntag</p>
          {weekly.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </div>
      )}

      {tab === 'special' && (
        <div className="space-y-3">
          {boss.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
          <SystemWindow title="Versteckte Quests">
            <ul className="space-y-2">
              {HIDDEN_QUESTS.map((h) => {
                const unlocked = unlocks.some((u) => u.id === h.id)
                return (
                  <li key={h.id} className="flex items-start gap-2 text-sm">
                    <span className={unlocked ? 'text-gold' : 'text-line'}>{unlocked ? '✦' : '◇'}</span>
                    <span className={unlocked ? 'text-gold' : 'text-dim'}>
                      {unlocked ? h.title.replace('GEHEIME QUEST ERFÜLLT: ', '') : h.hint}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-[11px] italic text-dim">
              Das System beobachtet mehr, als es verrät. Bestimmte Verhaltensmuster schalten Belohnungen frei.
            </p>
          </SystemWindow>
        </div>
      )}
    </div>
  )
}
