// Server-Sync für den Spielstand (Handy ↔ PC), Last-Write-Wins.
// Same-Origin – Traefik routet /api/* am selben Host auf den Sync-Dienst.
// Auth: Bearer-Token (siehe auth.ts), da die Seite öffentlich ist (TWA).
//
// Bewusst KEIN feldweiser Merge: WRs State ist ein zusammenhängender Spielstand.
// Bei einer neueren Server-Version wird der ganze Stand übernommen; lokale
// Änderungen werden gebündelt (debounced) als ganzer Stand hochgeladen.
import { useSystemStore } from '../store/useSystemStore'
import type { WRState } from '../store/state'
import { authHeaders, signalUnauthorized } from './auth'

const API = `${import.meta.env.BASE_URL}api/state`
const VERSION_KEY = 'wr-system.syncVersion'

let lastVersion = Number(localStorage.getItem(VERSION_KEY) || '0')
function setLastVersion(v: number): void {
  lastVersion = v
  try {
    localStorage.setItem(VERSION_KEY, String(v))
  } catch {
    /* ignore */
  }
}

let applyingRemote = false
let pushTimer: ReturnType<typeof setTimeout> | null = null
let started = false

/** Persistierbaren WRState-Teil aus dem Store ziehen (Actions + transiente Events raus). */
function serialize(): WRState {
  const s = useSystemStore.getState() as unknown as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(s)) {
    if (typeof v === 'function') continue
    out[k] = v
  }
  out.events = []
  return out as unknown as WRState
}

async function pull(): Promise<{ version: number; data: WRState | null }> {
  const r = await fetch(API, { headers: { Accept: 'application/json', ...authHeaders() }, cache: 'no-store' })
  if (r.status === 401) {
    signalUnauthorized()
    throw new Error('pull 401')
  }
  if (!r.ok) throw new Error(`pull ${r.status}`)
  return r.json()
}

async function push(): Promise<void> {
  const r = await fetch(API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ data: serialize() }),
  })
  if (r.status === 401) {
    signalUnauthorized()
    throw new Error('push 401')
  }
  if (!r.ok) throw new Error(`push ${r.status}`)
  const { version } = (await r.json()) as { version: number }
  setLastVersion(version)
}

function schedulePush(): void {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    push().catch((e) => console.warn('[sync] push', e.message))
  }, 1500)
}

/**
 * Server-Stand holen und ggf. übernehmen: bei neuerer Server-Version gewinnt der
 * Server (ein anderes Gerät hat gepusht). Leerer Server -> lokalen Stand als Seed
 * hochladen. Eigene Pushes heben lastVersion, lösen also keine Selbst-Übernahme aus.
 */
async function reconcile(): Promise<void> {
  const { version, data } = await pull()
  if (data == null) {
    await push()
    return
  }
  if (version !== lastVersion) {
    applyingRemote = true
    try {
      useSystemStore.getState().importState(data)
    } finally {
      applyingRemote = false
    }
    setLastVersion(version)
  }
}

/** Einmalig starten: Erst-Abgleich, dann Store-Änderungen pushen + bei Fokus/Online neu abgleichen. */
export function initSync(): void {
  if (started) return
  started = true

  reconcile().catch((e) => console.warn('[sync] initial reconcile', e.message))

  useSystemStore.subscribe(() => {
    if (applyingRemote) return
    schedulePush()
  })

  const refresh = () => {
    if (document.visibilityState === 'visible') reconcile().catch(() => {})
  }
  window.addEventListener('focus', refresh)
  window.addEventListener('online', refresh)
  document.addEventListener('visibilitychange', refresh)
}
