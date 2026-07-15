import { Component, type ErrorInfo, type ReactNode } from 'react'
import { SysButton } from './SystemWindow'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Fängt Render-/Lifecycle-Fehler ab, damit ein einzelner Wurf nicht den ganzen React-Baum
 * unmountet (→ leerer Bildschirm). Zeigt stattdessen eine System-Fehlermeldung mit Neustart.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <div className="anim-flicker w-full border border-danger/70 bg-black/60 p-6 shadow-[0_0_60px_rgba(244,63,94,0.35)]">
          <p className="anim-glitch mb-4 text-xl font-black tracking-[0.25em] text-danger">
            ⚠ SYSTEMFEHLER
          </p>
          <p className="mb-5 text-sm text-rose-200">
            Ein unerwarteter Fehler hat die Oberfläche gestoppt. Ein Neustart stellt das System wieder her.
          </p>
          <SysButton variant="danger" onClick={() => location.reload()} className="w-full">
            System neu starten
          </SysButton>
        </div>
      </div>
    )
  }
}
