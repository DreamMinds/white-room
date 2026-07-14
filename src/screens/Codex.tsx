import { useState } from 'react'
import { SysButton, SystemWindow } from '../components/SystemWindow'
import { CODEX_SECTIONS, MASTER_PROMPT, MODEL_LIBRARY } from '../data/seed'
import { useSystemStore } from '../store/useSystemStore'

export function CodexScreen() {
  const trainingPlan = useSystemStore((s) => s.settings.trainingPlan)
  const [open, setOpen] = useState<string | null>('kodex')
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function copyPrompt() {
    await navigator.clipboard.writeText(MASTER_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  return (
    <div className="space-y-4">
      <p className="text-xs italic leading-relaxed text-dim">
        Der Codex ist die Referenz hinter den Quests — kondensiert aus den vier WR-2.0-Dokumenten.
        Wissen ohne Anwendung ist Ballast: Kein Prinzip ohne Transfer.
      </p>

      {CODEX_SECTIONS.map((sec) => (
        <SystemWindow key={sec.id}>
          <button
            className="flex w-full items-center justify-between text-left"
            onClick={() => setOpen(open === sec.id ? null : sec.id)}
          >
            <span className="sys-title text-xs uppercase">{sec.title}</span>
            <span className="text-dim">{open === sec.id ? '▾' : '▸'}</span>
          </button>
          {open === sec.id && (
            <div className="mt-3 space-y-2">
              {sec.items.map((item) => {
                const key = `${sec.id}:${item.h}`
                return (
                  <div key={key} className="rounded border border-line/60 bg-void/40">
                    <button
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-slate-100"
                      onClick={() => setOpenItem(openItem === key ? null : key)}
                    >
                      {item.h}
                      <span className="text-dim">{openItem === key ? '−' : '+'}</span>
                    </button>
                    {openItem === key && (
                      <p className="border-t border-line/60 px-3 py-2 text-sm leading-relaxed text-slate-300">
                        {item.body}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </SystemWindow>
      ))}

      <SystemWindow title="Wochenplan (Hardware)">
        <table className="w-full text-sm">
          <tbody>
            {trainingPlan.map((t, i) => (
              <tr key={i} className="border-b border-line/40 last:border-0">
                <td className="py-1.5 pr-3 font-bold text-glow2">{days[i]}</td>
                <td className="py-1.5 text-slate-200">{t.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] italic text-dim">Es gilt: lieber 5 Min als gar nicht. Wenn Recovery bricht, bricht „Genialität" als erstes.</p>
      </SystemWindow>

      <SystemWindow title="Modell-Bibliothek">
        <ul className="space-y-1.5">
          {MODEL_LIBRARY.map((m) => (
            <li key={m.name} className="text-sm">
              <span className="font-semibold text-slate-100">{m.name}</span>
              <span className="text-dim"> — {m.desc}</span>
            </li>
          ))}
        </ul>
      </SystemWindow>

      <SystemWindow title="Master-Prompt: Strategy Review (WR)">
        <p className="mb-2 text-xs text-dim">
          Für das Claude-Projekt: kalt, präzise, adversarial. Kopieren, Situation einsetzen, Review erhalten.
        </p>
        <SysButton onClick={copyPrompt} className="w-full">
          {copied ? '✔ Kopiert' : '⧉ Master-Prompt kopieren'}
        </SysButton>
        <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-line bg-void/50 p-2 text-[11px] leading-relaxed text-dim">
          {MASTER_PROMPT}
        </pre>
      </SystemWindow>
    </div>
  )
}
