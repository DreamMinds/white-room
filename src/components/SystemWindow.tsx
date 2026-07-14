import type { ReactNode } from 'react'

export function SystemWindow({
  title,
  children,
  className = '',
  right,
}: {
  title?: string
  children: ReactNode
  className?: string
  right?: ReactNode
}) {
  return (
    <section className={`sys-window p-4 ${className}`}>
      {title && (
        <header className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-2">
          <h2 className="sys-title text-xs uppercase">{title}</h2>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

export function SysButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'gold'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const styles = {
    primary:
      'border-glow/60 bg-glow/10 text-glow2 hover:bg-glow/20 shadow-[0_0_12px_rgba(56,189,248,0.15)]',
    ghost: 'border-line bg-transparent text-dim hover:text-glow2 hover:border-glow/40',
    danger: 'border-danger/60 bg-danger/10 text-danger hover:bg-danger/20',
    gold: 'border-gold/60 bg-gold/10 text-gold hover:bg-gold/20',
  }[variant]
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded border px-3 py-1.5 text-sm font-semibold tracking-wide uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}
