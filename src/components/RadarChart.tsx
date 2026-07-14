import { STAT_IDS, STAT_META, RANK_THRESHOLDS } from '../domain/stats'
import type { StatId, StatState } from '../domain/types'

/** Radar über alle 7 Stats; Skala = Anteil an S-Rang-XP (log-gedämpft, damit früh sichtbar). */
export function RadarChart({ stats }: { stats: Record<StatId, StatState> }) {
  const size = 260
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 34
  const n = STAT_IDS.length
  const max = RANK_THRESHOLDS.S

  const value = (xp: number) => Math.min(1, Math.pow(xp / max, 0.45))

  const point = (i: number, factor: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return [cx + Math.cos(angle) * r * factor, cy + Math.sin(angle) * r * factor] as const
  }

  const polygon = (factor: number) =>
    STAT_IDS.map((_, i) => point(i, factor).join(',')).join(' ')

  const dataPolygon = STAT_IDS.map((s, i) => point(i, Math.max(0.04, value(stats[s].xp))).join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[300px]">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={polygon(f)} fill="none" stroke="var(--color-line)" strokeOpacity={0.6} strokeWidth={1} />
      ))}
      {STAT_IDS.map((_, i) => {
        const [x, y] = point(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-line)" strokeOpacity={0.5} strokeWidth={1} />
      })}
      <polygon
        points={dataPolygon}
        fill="var(--color-glow)"
        fillOpacity={0.22}
        stroke="var(--color-glow)"
        strokeWidth={1.5}
        style={{ filter: 'drop-shadow(0 0 6px var(--color-glow))' }}
      />
      {STAT_IDS.map((s, i) => {
        const [x, y] = point(i, 1.16)
        return (
          <text
            key={s}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-glow2)"
            fontSize={11}
            fontWeight={700}
            letterSpacing={1}
          >
            {STAT_META[s].short}
          </text>
        )
      })}
    </svg>
  )
}
