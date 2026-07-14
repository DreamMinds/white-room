export type Screen = 'status' | 'quests' | 'journal' | 'codex' | 'system'

const ITEMS: Array<{ id: Screen; label: string; icon: string }> = [
  { id: 'status', label: 'Status', icon: '⬢' },
  { id: 'quests', label: 'Quests', icon: '!' },
  { id: 'journal', label: 'Journal', icon: '✎' },
  { id: 'codex', label: 'Codex', icon: '§' },
  { id: 'system', label: 'System', icon: '⚙' },
]

export function BottomNav({
  active,
  onNavigate,
  questBadge,
}: {
  active: Screen
  onNavigate: (s: Screen) => void
  questBadge: number
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-lg">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              active === item.id ? 'glow-text' : 'text-dim hover:text-slate-300'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
            {item.id === 'quests' && questBadge > 0 && (
              <span className="absolute top-1 right-[22%] flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                {questBadge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
