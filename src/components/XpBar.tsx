export function XpBar({ pct, color = 'var(--color-glow)' }: { pct: number; color?: string }) {
  const clamped = Math.max(0, Math.min(1, pct))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/40">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${clamped * 100}%`,
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
    </div>
  )
}
