import type { ReactNode } from 'react'

export function Modal({
  title,
  children,
  onClose,
  closable = true,
}: {
  title: string
  children: ReactNode
  onClose?: () => void
  closable?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={closable ? onClose : undefined}
    >
      <div
        className="sys-window anim-rise m-0 max-h-[92dvh] w-full max-w-lg overflow-y-auto p-4 sm:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-3 flex items-center justify-between border-b border-line pb-2">
          <h2 className="sys-title text-sm uppercase">{title}</h2>
          {closable && (
            <button onClick={onClose} className="px-2 text-dim hover:text-glow2" aria-label="Schließen">
              ✕
            </button>
          )}
        </header>
        {children}
      </div>
    </div>
  )
}
