import { RadarChart } from '../components/RadarChart'
import { RankBadge, RANK_COLORS } from '../components/RankBadge'
import { SystemWindow } from '../components/SystemWindow'
import { XpBar } from '../components/XpBar'
import { jokersLeft, forecastStats } from '../domain/engine'
import { STAT_IDS, STAT_META, levelFor, rankProgress, titleFor, xpForLevel } from '../domain/stats'
import { daysBetween, todayKey } from '../lib/dates'
import { useSystemStore } from '../store/useSystemStore'

export function StatusScreen() {
  const state = useSystemStore()
  const totalXp = STAT_IDS.reduce((s, id) => s + state.stats[id].xp, 0)
  const level = levelFor(totalXp)
  const lvlLo = xpForLevel(level)
  const lvlHi = xpForLevel(level + 1)
  const left = jokersLeft(state)
  const fc = forecastStats(state)
  const today = todayKey()
  const title = state.unlocks.some((u) => u.id === 'hidden_streak30')
    ? 'Architekt'
    : state.unlocks.some((u) => u.id === 'hidden_calibration')
      ? 'Orakel'
      : titleFor(level)

  return (
    <div className="space-y-4">
      <SystemWindow title="Status">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-dim">{state.settings.playerName}</p>
            <p className="glow-text text-3xl font-black">LV. {level}</p>
            <p className="text-sm font-semibold text-gold">「{title}」</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-dim">
              Streak: <span className="font-bold text-glow2">{state.streak}</span> Tage
              <span className="text-xs text-dim"> (Best: {state.bestStreak})</span>
            </p>
            <p className="text-dim">
              Joker:{' '}
              <span className="font-bold text-gold">
                {'◆'.repeat(left)}
                <span className="text-line">{'◆'.repeat(3 - left)}</span>
              </span>
            </p>
            <p className="text-dim">
              Kalibrierung:{' '}
              <span className="font-bold text-glow2">
                {fc.resolved ? `Brier ${fc.brier.toFixed(2)}` : '—'}
              </span>
              <span className="text-xs"> ({fc.resolved} Progn. · {fc.realBets} echte Wetten)</span>
            </p>
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-dim">
            <span>XP {totalXp}</span>
            <span>Level {level + 1}: {lvlHi} XP</span>
          </div>
          <XpBar pct={(totalXp - lvlLo) / (lvlHi - lvlLo)} />
        </div>
      </SystemWindow>

      <SystemWindow title="Attribut-Matrix">
        <RadarChart stats={state.stats} />
      </SystemWindow>

      <SystemWindow title="Stats">
        <div className="space-y-3">
          {STAT_IDS.map((id) => {
            const stat = state.stats[id]
            const rp = rankProgress(stat.xp)
            const inactive = daysBetween(stat.lastActivity, today)
            return (
              <div key={id} className="flex items-center gap-3">
                <RankBadge rank={rp.rank} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-100">{STAT_META[id].name}</p>
                    <p className="shrink-0 text-xs text-dim">
                      {stat.xp} XP{rp.next && <span> · {rp.toNext} bis {rp.next}</span>}
                    </p>
                  </div>
                  <XpBar pct={rp.pct} color={RANK_COLORS[rp.rank]} />
                  {inactive > 3 && (
                    <p className="mt-0.5 text-[11px] font-semibold text-danger">
                      ⚠ DECAY AKTIV — {inactive} Tage ohne Aktivität, XP fallen täglich
                    </p>
                  )}
                  {inactive === 3 && (
                    <p className="mt-0.5 text-[11px] text-gold">⚠ Decay ab morgen — heute Aktivität nötig</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 text-[11px] leading-relaxed text-dim">
          <p>
            Dein Körper und Geist sind dein <strong className="font-semibold text-slate-100">Charakter</strong>.
            Deine fundamentalen Stats sind:
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>
              <strong className="font-semibold text-slate-100">Energie (Ausdauer):</strong> Gesteuert durch
              Schlaf und Ernährung.
            </li>
            <li>
              <strong className="font-semibold text-slate-100">Fokus/Konzentration (Mana):</strong> Gesteuert
              durch Pausen, Bewegung und dein Umfeld.
            </li>
            <li>
              <strong className="font-semibold text-slate-100">Mentale Gesundheit (Willenskraft):</strong>{' '}
              Gesteuert durch Stressmanagement und soziale Kontakte.
            </li>
          </ul>
        </div>
      </SystemWindow>
    </div>
  )
}
