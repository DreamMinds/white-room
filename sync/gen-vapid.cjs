'use strict'
/**
 * Erzeugt EINMALIG ein VAPID-Schlüsselpaar für Web Push (P-256 / ES256).
 *   node sync/gen-vapid.cjs
 *
 * Ausgabe:
 *   - VAPID_PUBLIC  → als Env in docker-compose.yml UND als VITE_VAPID_PUBLIC beim Frontend-Build.
 *   - VAPID_PRIVATE → NUR in die gitignorte docker-compose.override.yml (Geheimnis, wie SYNC_TOKEN).
 *
 * Der öffentliche Schlüssel ist der rohe, unkomprimierte EC-Punkt (65 Byte, 0x04||X||Y) base64url —
 * exakt das Format, das der Browser als `applicationServerKey` und im VAPID-Header `k` erwartet.
 */
const crypto = require('crypto')

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const pubJwk = publicKey.export({ format: 'jwk' })
const privJwk = privateKey.export({ format: 'jwk' })

const raw = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(pubJwk.x, 'base64url'),
  Buffer.from(pubJwk.y, 'base64url'),
])

console.log('VAPID_PUBLIC (→ docker-compose env + VITE_VAPID_PUBLIC beim Build):')
console.log(raw.toString('base64url'))
console.log()
console.log('VAPID_PRIVATE (→ docker-compose.override.yml, EINE Zeile, geheim halten):')
console.log(JSON.stringify(privJwk))
