// Web-Push-Abo (Client-Seite). Der eigentliche Reminder kommt server-getrieben (whiteroom-sync),
// damit er auch bei GESCHLOSSENER App feuert — der Vordergrund-Timer in App.tsx ist nur Fallback.
import { authHeaders } from './auth'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC as string | undefined
const API = `${import.meta.env.BASE_URL}api/push/subscribe`

/** base64url-VAPID-Key → Uint8Array (Format, das pushManager.subscribe erwartet). */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/**
 * Abonniert Push für dieses Gerät und meldet die Subscription am Sync-Server an.
 * Idempotent: eine bestehende Subscription wird wiederverwendet. Gibt true bei Erfolg.
 * Setzt eine bereits erteilte Notification-Permission voraus.
 */
export async function subscribePush(): Promise<boolean> {
  if (!VAPID_PUBLIC || !('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      }))
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    })
    return r.ok
  } catch (e) {
    console.warn('subscribePush fehlgeschlagen:', e)
    return false
  }
}
