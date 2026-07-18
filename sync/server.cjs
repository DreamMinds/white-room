'use strict'
/**
 * White Room 2.0 System – minimaler Sync-Dienst (nur Node-Stdlib, keine Dependencies).
 *
 * State-Sync (Handy ↔ PC) nach Last-Write-Wins: der zuletzt gespeicherte ganze
 * Spielstand gewinnt. Bewusst KEIN feldweiser Merge – WRs State (XP, Streak,
 * Quests, Strafen) ist ein zusammenhängender Spielstand, feldweises Mischen würde
 * Invarianten zerstören. Tradeoff: bearbeitet man PC und Handy gleichzeitig
 * offline, gewinnt beim nächsten Sync der zuletzt hochgeladene Stand.
 *
 *   GET  /api/state              -> { version, data }
 *   PUT  /api/state {data}       -> 200 { version }   (version++, data gespeichert)
 *
 * Persistenz: DATA_DIR/state.json (atomischer Write) + rotierende Backups.
 * Auth/TLS macht Traefik davor – der Dienst lauscht nur lokal. Zugriff auf /api
 * schützt SYNC_TOKEN (Bearer-Token), da die Seite selbst öffentlich ist (TWA).
 */
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DATA_DIR = process.env.DATA_DIR || '/data'
const STATE_FILE = path.join(DATA_DIR, 'state.json')
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json')
const BACKUP_DIR = path.join(DATA_DIR, 'backups')
const PORT = Number(process.env.PORT || 8080)
const MAX_BODY = 8 * 1024 * 1024 // 8 MB
const KEEP_BACKUPS = 30

// Geteiltes Geheimnis für den API-Zugriff. Einziger Schutz für /api/state,
// da die Seite öffentlich ist (native TWA kann keine Basic-Auth-Header senden).
const SYNC_TOKEN = process.env.SYNC_TOKEN || ''

// Web Push (VAPID). Ohne Payload — der Service Worker zeigt eine feste Meldung; die
// RELEVANZ steckt in der Entscheidung, ob überhaupt gesendet wird (offene Pflicht-Quests).
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || '' // roher P-256-Punkt, base64url
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || '' // privater Schlüssel als JWK-JSON
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@janbanick.de'
const PUSH_DEFAULT_WARN_HOURS = 3 // Fallback, falls settings.warnHoursBefore fehlt

const log = (...a) => console.log(new Date().toISOString(), ...a)

fs.mkdirSync(BACKUP_DIR, { recursive: true })

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  } catch {
    return { version: 0, data: null }
  }
}

function writeState(obj) {
  const tmp = STATE_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(obj))
  fs.renameSync(tmp, STATE_FILE)
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    fs.copyFileSync(STATE_FILE, path.join(BACKUP_DIR, `state-${stamp}.json`))
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('state-')).sort()
    for (const f of files.slice(0, Math.max(0, files.length - KEEP_BACKUPS))) {
      fs.unlinkSync(path.join(BACKUP_DIR, f))
    }
  } catch (e) {
    console.error('backup failed:', e && e.message)
  }
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(obj))
}

// Body lesen + JSON parsen, mit Größenlimit; ruft cb(payload) nur bei gültigem JSON.
function readBody(req, res, cb) {
  let body = ''
  let tooBig = false
  req.on('data', (chunk) => {
    body += chunk
    if (body.length > MAX_BODY) { tooBig = true; req.destroy() }
  })
  req.on('end', () => {
    if (tooBig) return json(res, 413, { error: 'payload too large' })
    let payload
    try { payload = JSON.parse(body) } catch { return json(res, 400, { error: 'invalid json' }) }
    cb(payload)
  })
}

// ---------- Web Push ----------

function readSubs() {
  try {
    return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8'))
  } catch {
    return { subs: [], lastPushDay: '' }
  }
}

function writeSubs(obj) {
  const tmp = SUBS_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(obj))
  fs.renameSync(tmp, SUBS_FILE)
}

let vapidKey = null
function getVapidKey() {
  if (vapidKey || !VAPID_PRIVATE) return vapidKey
  try {
    vapidKey = crypto.createPrivateKey({ key: JSON.parse(VAPID_PRIVATE), format: 'jwk' })
  } catch (e) {
    console.error('VAPID_PRIVATE ungültig:', e && e.message)
  }
  return vapidKey
}

const b64url = (buf) => Buffer.from(buf).toString('base64url')

// Signiertes VAPID-JWT (ES256, JOSE-Signatur = rohes R||S dank ieee-p1363).
function vapidJwt(audience) {
  const key = getVapidKey()
  if (!key) return null
  const header = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const payload = b64url(
    JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: VAPID_SUBJECT }),
  )
  const data = `${header}.${payload}`
  const sig = crypto.sign('sha256', Buffer.from(data), { key, dsaEncoding: 'ieee-p1363' })
  return `${data}.${b64url(sig)}`
}

// Payload-loser Push an einen Endpoint. Auflösung: { status, gone } — gone=true bei 404/410
// (abgemeldetes Gerät → Subscription verwerfen).
function sendPush(sub) {
  return new Promise((resolve) => {
    let u
    try { u = new URL(sub.endpoint) } catch { return resolve({ gone: true }) }
    const jwt = vapidJwt(`${u.protocol}//${u.host}`)
    if (!jwt) return resolve({ error: 'no-vapid' })
    const req = https.request(
      {
        method: 'POST',
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        headers: {
          TTL: '3600',
          Urgency: 'normal',
          Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC}`,
          'Content-Length': 0,
        },
      },
      (res) => {
        res.resume()
        const gone = res.statusCode === 404 || res.statusCode === 410
        resolve({ status: res.statusCode, gone })
      },
    )
    req.on('error', (e) => resolve({ error: e.message }))
    req.end()
  })
}

// An alle Subscriptions senden; tote (404/410) dabei aussortieren.
async function pushAll() {
  const store = readSubs()
  if (!store.subs.length) return { sent: 0, subs: 0 }
  const keep = []
  let sent = 0
  for (const sub of store.subs) {
    const r = await sendPush(sub)
    if (r.gone) continue
    keep.push(sub)
    if (r.status && r.status < 300) sent++
  }
  store.subs = keep
  writeSubs(store)
  return { sent, subs: keep.length }
}

// "YYYY-MM-DD" in lokaler Zeit — muss zur Client-todayKey passen (deshalb TZ im Container setzen).
function localDayKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function hasOpenRequiredDailies(today) {
  const s = readState()
  const quests = s && s.data && s.data.quests
  if (!Array.isArray(quests)) return false
  return quests.some((q) => q.kind === 'daily' && q.day === today && q.required && q.status === 'open')
}

// Minütlicher Tick: einmal pro Tag, ab der Warn-Stunde, nur wenn heute Pflicht-Quests offen sind.
function pushTick() {
  try {
    if (!VAPID_PRIVATE || !VAPID_PUBLIC) return
    const now = new Date()
    const today = localDayKey(now)
    const store = readSubs()
    if (store.lastPushDay === today || !store.subs.length) return
    const s = readState()
    const settings = s && s.data && s.data.settings
    const warn = (settings && Number(settings.warnHoursBefore)) || PUSH_DEFAULT_WARN_HOURS
    const pushHour = process.env.PUSH_HOUR ? Number(process.env.PUSH_HOUR) : Math.max(0, 24 - warn)
    if (now.getHours() < pushHour) return
    if (!hasOpenRequiredDailies(today)) return
    store.lastPushDay = today
    writeSubs(store)
    pushAll().then((r) => log('daily push:', JSON.stringify(r)))
  } catch (e) {
    console.error('pushTick:', e && e.message)
  }
}

// Prüft `Authorization: Bearer <SYNC_TOKEN>`. Fail-closed: ohne konfiguriertes
// Token wird jede geschützte Route abgelehnt (503). Konstantzeit-Vergleich.
function requireAuth(req, res) {
  if (!SYNC_TOKEN) {
    json(res, 503, { error: 'auth not configured' })
    return false
  }
  const header = req.headers['authorization'] || ''
  const m = /^Bearer\s+(.+)$/i.exec(header)
  const provided = Buffer.from(m ? m[1] : '')
  const expected = Buffer.from(SYNC_TOKEN)
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    json(res, 401, { error: 'unauthorized' })
    return false
  }
  return true
}

const server = http.createServer((req, res) => {
  let u
  try {
    u = new URL(req.url || '/', 'http://localhost')
  } catch {
    return json(res, 400, { error: 'bad url' })
  }

  if (u.pathname === '/api/state') {
    if (!requireAuth(req, res)) return

    if (req.method === 'GET') {
      const s = readState()
      return json(res, 200, { version: s.version, data: s.data })
    }

    if (req.method === 'PUT') {
      let body = ''
      let tooBig = false
      req.on('data', (chunk) => {
        body += chunk
        if (body.length > MAX_BODY) { tooBig = true; req.destroy() }
      })
      req.on('end', () => {
        if (tooBig) return json(res, 413, { error: 'payload too large' })
        let payload
        try { payload = JSON.parse(body) } catch { return json(res, 400, { error: 'invalid json' }) }
        if (payload.data == null || typeof payload.data !== 'object') {
          return json(res, 400, { error: 'missing data' })
        }
        // Last-Write-Wins: keine baseVersion-Prüfung, der PUT gewinnt immer.
        const next = { version: (readState().version || 0) + 1, data: payload.data }
        writeState(next)
        return json(res, 200, { version: next.version })
      })
      return
    }

    return json(res, 405, { error: 'method not allowed' })
  }

  // Push-Subscription eines Geräts registrieren (idempotent, Dedupe per endpoint).
  if (u.pathname === '/api/push/subscribe') {
    if (!requireAuth(req, res)) return
    if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
    readBody(req, res, (payload) => {
      const sub = payload && (payload.subscription || payload)
      if (!sub || typeof sub.endpoint !== 'string') return json(res, 400, { error: 'missing subscription' })
      const store = readSubs()
      if (!store.subs.some((x) => x.endpoint === sub.endpoint)) store.subs.push(sub)
      writeSubs(store)
      return json(res, 200, { ok: true, count: store.subs.length })
    })
    return
  }

  // Manueller Sofort-Push an alle Geräte — zum Verifizieren ohne bis zur Warn-Stunde zu warten.
  if (u.pathname === '/api/push/test') {
    if (!requireAuth(req, res)) return
    if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
    pushAll()
      .then((r) => json(res, 200, r))
      .catch((e) => json(res, 500, { error: e && e.message }))
    return
  }

  return json(res, 404, { error: 'not found' })
})

server.listen(PORT, '0.0.0.0', () => {
  log(`whiteroom-sync listening on ${PORT}, data in ${DATA_DIR}`)
  if (!SYNC_TOKEN) log('WARNUNG: SYNC_TOKEN nicht gesetzt – /api/state antwortet fail-closed mit 503.')
  if (VAPID_PUBLIC && VAPID_PRIVATE) {
    setInterval(pushTick, 60000)
    log('Web Push aktiv (VAPID gesetzt), täglicher Reminder-Scheduler läuft.')
  } else {
    log('Web Push inaktiv (VAPID_PUBLIC/PRIVATE fehlen).')
  }
})
