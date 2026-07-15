import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { getToken, setToken, clearToken, UNAUTHORIZED_EVENT } from '../lib/auth'
import { initSync } from '../lib/sync'

const API = `${import.meta.env.BASE_URL}api/state`

/**
 * Gate um die ganze App: Die Seite ist öffentlich (native TWA), aber die Sync-API
 * verlangt ein Bearer-Token. Ohne gültigen Token zeigt der Gate einen einmaligen
 * Passwort-Screen (ein geteiltes Geheimnis – kein Account-System). Ein 401 einer
 * späteren Anfrage (Token geändert) blendet über das UNAUTHORIZED_EVENT den Login
 * wieder ein.
 *
 * Ist bereits ein Token gespeichert, wird die App optimistisch gerendert (damit die
 * PWA auch offline startet) und der Sync gestartet; erst ein echter 401 zeigt den
 * Login erneut.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => Boolean(getToken()))

  useEffect(() => {
    const onUnauthorized = () => setAuthed(false)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  useEffect(() => {
    if (authed) initSync()
  }, [authed])

  if (authed) return <>{children}</>
  return <Login onSuccess={() => setAuthed(true)} />
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const token = secret.trim()
    if (!token || busy) return
    setBusy(true)
    setError('')
    try {
      const r = await fetch(API, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (r.status === 401) {
        clearToken()
        setError('Falscher Zugangscode.')
        return
      }
      if (!r.ok) {
        setError(`Server nicht erreichbar (${r.status}).`)
        return
      }
      setToken(token)
      onSuccess()
    } catch {
      setError('Keine Verbindung zum Server.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-void px-6 text-[#dbeafe]">
      <form onSubmit={submit} className="w-full max-w-xs flex flex-col gap-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-widest text-glow uppercase">White Room</h1>
          <p className="text-sm text-dim mt-2">Zugangscode eingeben, um das System zu entsperren.</p>
        </div>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          className="w-full rounded-lg border border-line bg-panel px-4 py-3 text-[#dbeafe] outline-none focus:border-glow"
          placeholder="Zugangscode"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        <button
          type="submit"
          disabled={busy || !secret.trim()}
          className="w-full rounded-lg bg-glow px-4 py-3 font-semibold uppercase tracking-wide text-void transition disabled:opacity-40"
        >
          {busy ? 'Prüfe …' : 'Entsperren'}
        </button>
      </form>
    </div>
  )
}
