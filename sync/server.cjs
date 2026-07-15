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
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DATA_DIR = process.env.DATA_DIR || '/data'
const STATE_FILE = path.join(DATA_DIR, 'state.json')
const BACKUP_DIR = path.join(DATA_DIR, 'backups')
const PORT = Number(process.env.PORT || 8080)
const MAX_BODY = 8 * 1024 * 1024 // 8 MB
const KEEP_BACKUPS = 30

// Geteiltes Geheimnis für den API-Zugriff. Einziger Schutz für /api/state,
// da die Seite öffentlich ist (native TWA kann keine Basic-Auth-Header senden).
const SYNC_TOKEN = process.env.SYNC_TOKEN || ''

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

  return json(res, 404, { error: 'not found' })
})

server.listen(PORT, '0.0.0.0', () => {
  log(`whiteroom-sync listening on ${PORT}, data in ${DATA_DIR}`)
  if (!SYNC_TOKEN) log('WARNUNG: SYNC_TOKEN nicht gesetzt – /api/state antwortet fail-closed mit 503.')
})
