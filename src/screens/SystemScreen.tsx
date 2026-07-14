import { useRef, useState } from 'react'
import { SysButton, SystemWindow } from '../components/SystemWindow'
import { HIDDEN_QUESTS } from '../data/seed'
import { exportBackup } from '../domain/exporter'
import { STAT_META } from '../domain/stats'
import type { StatId } from '../domain/types'
import { formatDateTime, formatDay } from '../lib/dates'
import type { WRState } from '../store/state'
import { useSystemStore } from '../store/useSystemStore'

export function SystemScreen() {
  const store = useSystemStore()
  const { settings, joker, penalties, unlocks } = store
  const updateSettings = useSystemStore((s) => s.updateSettings)
  const importState = useSystemStore((s) => s.importState)
  const resetAll = useSystemStore((s) => s.resetAll)

  const [url, setUrl] = useState(settings.claudeUrl)
  const [name, setName] = useState(settings.playerName)
  const [savedMsg, setSavedMsg] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const monarchUnlocked = unlocks.some((u) => u.id === 'hidden_streak7')

  function saveBasics() {
    updateSettings({ claudeUrl: url.trim(), playerName: name.trim() || 'Spieler' })
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  async function requestNotifications() {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    updateSettings({ notificationsEnabled: perm === 'granted' })
  }

  function onImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as WRState
        if (!data.stats || !data.settings) throw new Error('invalid')
        importState(data)
      } catch {
        alert('Ungültige Backup-Datei.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <SystemWindow title="Sparringspartner (Claude-Projekt)">
        <p className="mb-2 text-xs text-dim">
          Link zu deinem Claude-Projekt für Simulationen, [SZENARIO]-Sparring (Format D) und Strategy Reviews.
        </p>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://claude.ai/project/…"
          className="mb-2 w-full rounded border border-line bg-void/60 p-2 text-sm outline-none focus:border-glow"
        />
        <div className="flex gap-2">
          <SysButton onClick={saveBasics}>{savedMsg ? '✔ Gespeichert' : 'Speichern'}</SysButton>
          {settings.claudeUrl && (
            <a
              href={settings.claudeUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-glow/60 bg-glow/10 px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-glow2 hover:bg-glow/20"
            >
              ▶ Öffnen
            </a>
          )}
        </div>
      </SystemWindow>

      <SystemWindow title="Spieler">
        <label className="mb-3 block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-dim">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-line bg-void/60 p-2 text-sm outline-none focus:border-glow"
          />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-dim">
            Warnung vor Tagesdeadline (Stunden vorher)
          </span>
          <select
            value={settings.warnHoursBefore}
            onChange={(e) => updateSettings({ warnHoursBefore: Number(e.target.value) })}
            className="w-full rounded border border-line bg-void/60 p-2 text-sm outline-none focus:border-glow"
          >
            {[2, 3, 4, 6, 8].map((h) => (
              <option key={h} value={h}>{h} Stunden</option>
            ))}
          </select>
        </label>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-200">Browser-Benachrichtigungen</span>
          <SysButton variant={settings.notificationsEnabled ? 'ghost' : 'primary'} onClick={requestNotifications}>
            {settings.notificationsEnabled ? '✔ Aktiv' : 'Aktivieren'}
          </SysButton>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-200">
            Theme {!monarchUnlocked && <span className="text-xs text-dim">(Monarch: verborgen — ???)</span>}
          </span>
          <select
            value={settings.theme}
            onChange={(e) => updateSettings({ theme: e.target.value as 'system' | 'monarch' })}
            className="rounded border border-line bg-void/60 p-1.5 text-sm outline-none focus:border-glow"
          >
            <option value="system">System (Cyan)</option>
            {monarchUnlocked && <option value="monarch">Monarch (Violett)</option>}
          </select>
        </div>
        <SysButton onClick={saveBasics} className="mt-3">{savedMsg ? '✔ Gespeichert' : 'Speichern'}</SysButton>
      </SystemWindow>

      <SystemWindow title="Joker-Protokoll">
        <p className="mb-2 text-sm text-slate-200">
          Monat {joker.month}: <span className="font-bold text-gold">{3 - joker.used}/3 übrig</span>
        </p>
        {joker.log.length === 0 && <p className="text-xs text-dim">Noch kein Joker eingesetzt.</p>}
        <ul className="space-y-1 text-xs text-dim">
          {[...joker.log].reverse().slice(0, 10).map((l, i) => (
            <li key={i}>◆ {formatDay(l.day)} — {l.reason}</li>
          ))}
        </ul>
      </SystemWindow>

      <SystemWindow title="Sanktions-Historie">
        {penalties.length === 0 && <p className="text-xs text-dim">Keine Sanktionen. Halte es so.</p>}
        <ul className="space-y-2 text-xs">
          {[...penalties].reverse().slice(0, 10).map((p, i) => (
            <li key={i} className="border-l-2 border-danger/60 pl-2 text-dim">
              <span className="font-semibold text-danger">{formatDay(p.day)}</span> — {p.reason}
              <br />
              {(Object.entries(p.xpLoss) as Array<[StatId, number]>)
                .map(([s, v]) => `−${v} ${STAT_META[s].short}`)
                .join(' · ')}
            </li>
          ))}
        </ul>
      </SystemWindow>

      <SystemWindow title="Errungenschaften">
        {unlocks.length === 0 && <p className="text-xs text-dim">Noch nichts freigeschaltet. Das System wartet.</p>}
        <ul className="space-y-1 text-sm">
          {unlocks.map((u) => {
            const def = HIDDEN_QUESTS.find((h) => h.id === u.id)
            return (
              <li key={u.id} className="text-gold">
                ✦ {def?.title.replace('GEHEIME QUEST ERFÜLLT: ', '') ?? u.id}
                <span className="ml-1 text-xs text-dim">({formatDateTime(u.unlockedAt)})</span>
              </li>
            )
          })}
        </ul>
      </SystemWindow>

      <SystemWindow title="Daten">
        <div className="flex flex-wrap gap-2">
          <SysButton variant="ghost" onClick={() => exportBackup(store)}>⬇ Backup exportieren</SysButton>
          <SysButton variant="ghost" onClick={() => fileRef.current?.click()}>⬆ Backup importieren</SysButton>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
          />
        </div>
        <div className="mt-4 border-t border-danger/30 pt-3">
          {!confirmReset ? (
            <SysButton variant="danger" onClick={() => setConfirmReset(true)}>System zurücksetzen…</SysButton>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-danger">Alle Daten unwiderruflich löschen?</span>
              <SysButton variant="danger" onClick={() => { resetAll(); setConfirmReset(false) }}>Ja, löschen</SysButton>
              <SysButton variant="ghost" onClick={() => setConfirmReset(false)}>Abbrechen</SysButton>
            </div>
          )}
        </div>
      </SystemWindow>
    </div>
  )
}
