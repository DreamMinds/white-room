import { useState } from 'react'
import type { QuestInstance } from '../domain/types'
import { savePhoto } from '../store/proofStore'
import { Modal } from './Modal'
import { SysButton } from './SystemWindow'

/** Abschluss-Dialog für Foto-/Text-Proof-Quests (Training, Strafquests). */
export function ProofDialog({
  quest,
  min,
  onSubmit,
  onClose,
}: {
  quest: QuestInstance
  min: boolean
  onSubmit: (opts: { min: boolean; proofText?: string; proofPhotoId?: string }) => void
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      const proofPhotoId = file ? await savePhoto(file) : undefined
      onSubmit({ min, proofText: text.trim() || undefined, proofPhotoId })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={min ? 'Minimum-Protokoll' : 'Proof of Work'} onClose={onClose}>
      <p className="mb-1 text-sm font-semibold text-glow2">{quest.title}</p>
      {min && (
        <p className="mb-2 text-xs text-gold">
          „Lieber 5 Min als gar nicht." — 25 % XP, zählt gegen die Strafe. Kein Dauerzustand.
        </p>
      )}
      <p className="mb-3 text-xs text-dim">
        Selbstreporting ist der Tod der Gamification. Lade einen Beweis hoch (Foto, Strava-Screenshot) oder
        notiere präzise, was du gemacht hast. Du belügst hier nur dein eigenes System.
      </p>

      <label className="mb-3 block">
        <span className="mb-1 block text-xs uppercase tracking-wider text-dim">Foto / Screenshot (optional)</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="block w-full text-xs text-dim file:mr-3 file:rounded file:border file:border-glow/50 file:bg-glow/10 file:px-3 file:py-1.5 file:text-glow2"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            setFile(f)
            setPreview(f ? URL.createObjectURL(f) : null)
          }}
        />
      </label>
      {preview && <img src={preview} alt="Beweis" className="mb-3 max-h-48 rounded border border-line" />}

      <label className="mb-4 block">
        <span className="mb-1 block text-xs uppercase tracking-wider text-dim">Was genau wurde absolviert?</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="z.B. 45 Min Krav Maga + 8 km @ 5:40/km"
          className="w-full rounded border border-line bg-void/60 p-2 text-sm outline-none focus:border-glow"
        />
      </label>

      <div className="flex justify-end gap-2">
        <SysButton variant="ghost" onClick={onClose}>Abbrechen</SysButton>
        <SysButton onClick={submit} disabled={busy || (!file && text.trim().length < 5)}>
          {busy ? '…' : min ? 'Minimum bestätigen' : 'Abschließen'}
        </SysButton>
      </div>
    </Modal>
  )
}
