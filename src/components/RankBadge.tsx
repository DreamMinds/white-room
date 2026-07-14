import type { Rank } from '../domain/types'

export const RANK_COLORS: Record<Rank, string> = {
  F: '#94a3b8',
  E: '#4ade80',
  D: '#2dd4bf',
  C: '#38bdf8',
  B: '#a78bfa',
  A: '#fb923c',
  S: '#fbbf24',
}

export function RankBadge({ rank, size = 'md' }: { rank: Rank; size?: 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'h-12 w-12 text-2xl' : 'h-8 w-8 text-base'
  return (
    <span
      className={`rank-badge inline-flex items-center justify-center rounded border ${cls}`}
      style={{ color: RANK_COLORS[rank], borderColor: `${RANK_COLORS[rank]}88`, background: `${RANK_COLORS[rank]}14` }}
    >
      {rank}
    </span>
  )
}
