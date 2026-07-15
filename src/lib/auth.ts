// Zugriffs-Token für die Sync-API. Da die Seite öffentlich ist (native TWA), ist
// das geteilte Geheimnis (einmal im Login-Screen eingegeben) der einzige Schutz
// für /api/state. Es wird NUR im localStorage gehalten – nie ins Build gebacken.

const TOKEN_KEY = 'wr-system.syncToken'

/** Event, das der AuthGate abhört, um bei einem 401 den Login erneut anzuzeigen. */
export const UNAUTHORIZED_EVENT = 'wr-system:unauthorized'

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* localStorage nicht verfügbar – dann bleibt der Token nur im Session-Speicher */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/** Authorization-Header für die Fetch-Aufrufe (leer, solange kein Token gesetzt ist). */
export function authHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/** Verwirft den Token und signalisiert der App, dass ein Re-Login nötig ist. */
export function signalUnauthorized(): void {
  clearToken()
  try {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  } catch {
    /* kein window (SSR/Test) – ignore */
  }
}
