import type { FormKind, StatId, TrainingDay } from '../domain/types'

/** Wochenplan: 5 Einheiten + 1 leichter Tag + 1 voller Ruhetag. Index 0=Mo … 6=So */
export const DEFAULT_TRAINING_PLAN: TrainingDay[] = [
  {
    title: 'Krav Maga + Zone-2-Lauf',
    desc: 'Sparring/Techniktraining (Krav Maga) + Lauf explizit locker (Zone 2, Unterhaltungs-Tempo).',
    rewards: { strength: 30, agility: 30 },
  },
  {
    title: 'Kraftsport (Calisthenics)',
    desc: 'Calisthenics-Einheit: Grundübungen + Skill-Arbeit.',
    rewards: { strength: 40, vitality: 20 },
  },
  {
    title: 'Krav Maga + Intervalle',
    desc: 'Sparring/Techniktraining (Krav Maga) + Tempoläufe/Intervalltraining. Der harte Tag der Woche.',
    rewards: { strength: 25, agility: 35 },
  },
  {
    title: 'Mobilität',
    desc: 'Beweglichkeit, Dehnen, Haltung — leichter Tag zwischen den harten Einheiten, kein Explosivtraining.',
    rewards: { vitality: 35, agility: 15 },
  },
  {
    title: 'Kraftsport (Calisthenics) + Plyo-Finish',
    desc: 'Calisthenics-Einheit: Grundübungen + Skill-Arbeit, danach kurzes Plyometrics-Finish (Explosivkraft).',
    rewards: { strength: 35, agility: 25 },
  },
  {
    title: 'Krav Maga + Longrun',
    desc: 'Sparring/Techniktraining (Krav Maga) + langer Ausdauerlauf.',
    rewards: { strength: 25, agility: 35 },
  },
  {
    title: 'Ruhetag / Recovery',
    desc: 'Kein Training. Schlaf-Fokus, optional 15 Min lockere Mobilität. Wenn Recovery bricht, bricht Genialität als erstes — dieser Tag ist Teil des Systems, nicht seine Abwesenheit.',
    rewards: { vitality: 30 },
  },
]

export interface DailyTemplate {
  templateId: string
  title: string
  desc: string
  rewards: Partial<Record<StatId, number>>
  proof: 'photo' | 'text' | 'form'
  formKind?: FormKind
  minAllowed?: boolean
}

export const DAILY_FORECAST: DailyTemplate = {
  templateId: 'daily_forecast',
  title: 'Prognose des Tages',
  desc: 'Eine Vorhersage: Was wird passieren? Wahrscheinlichkeit in %? Warum (Kausalkette)? Bevorzugt als Move + Response. Nicht in 50/50 flüchten.',
  rewards: { perception: 10, strategy: 10 },
  proof: 'form',
  formKind: 'forecast',
}

export const DAILY_POSTGAME: DailyTemplate = {
  templateId: 'daily_postgame',
  title: 'Post-Game-Reflexion',
  desc: '10 Minuten. Eine relevante Szene des Tages durch die 6 Kernfragen ziehen, danach 30-Sekunden-Rehearsal. Kein Kopf mehr? Minimal-Eintrag (1 Zahl + 1 Satz) zählt als gültiger Tag.',
  rewards: { intelligence: 15, perception: 10 },
  proof: 'form',
  formKind: 'postgame',
  minAllowed: true,
}

export interface WeeklyTemplate {
  templateId: string
  title: string
  desc: string
  rewards: Partial<Record<StatId, number>>
  proof: 'form' | 'counter' | 'text'
  formKind?: FormKind
  counterTarget?: number
}

/**
 * Kern: läuft jede Woche. Rotation: 2 von 3 pro Woche (deterministisch nach ISO-Kalenderwoche,
 * siehe pickRotationTemplates in engine.ts) — hält die Wochenlast bei 6 statt 7+ Slots,
 * ohne Breite über den Monat zu verlieren (Entscheidung 2026-07-20: 7 feste Weeklies waren
 * neben Jans anderen Zielen zu viel).
 */
export const WEEKLY_CORE_TEMPLATES: WeeklyTemplate[] = [
  {
    templateId: 'weekly_model',
    title: 'Modell der Woche — 5× anwenden',
    desc: 'Ein mentales Modell aus der Bibliothek wählen und 5× bewusst im Alltag anwenden. Pro Anwendung ein Strich + 1 Satz. Anwendung 5 = Pflicht-Falsifikation: 1 Fall, wo das Modell NICHT passt oder irreführt.',
    rewards: { intelligence: 60, strategy: 40 },
    proof: 'counter',
    formKind: 'model',
    counterTarget: 5,
  },
  {
    templateId: 'weekly_uncomfortable',
    title: 'Bewusst unangenehme Situationen (2×)',
    desc: '2–3× pro Woche: Grenze setzen · Nachfrage statt Erklärung · „Ich entscheide das bis morgen" · „Was soll dafür liegen bleiben?" — Abruf unter mildem Stress. Pro Situation ein Strich + 1 Satz (Was getan? Körperreaktion? Outcome/If-Then?).',
    rewards: { strength: 40, influence: 20 },
    proof: 'counter',
    formKind: 'uncomfortable',
    counterTarget: 2,
  },
  {
    templateId: 'weekly_warmth',
    title: 'Vertrauens-Invest (1×)',
    desc: '1 gezielter Invest ohne Agenda: echter Gefallen, Warm-Intro, ehrliches Interesse. Kompetenz ohne Wärme erzeugt Neid — dieser Rep schließt die Flanke.',
    rewards: { influence: 40, vitality: 20 },
    proof: 'form',
    formKind: 'warmth',
  },
  {
    templateId: 'weekly_review',
    title: 'Weekly Review (Sonntag, 20 Min)',
    desc: 'Scoreboard prüfen → Meta-Regel der Woche → nächstes Modell + Effekt wählen → nächstes Sparring definieren → 1 Real-Life-Move, 2 Einsätze.',
    rewards: { intelligence: 40, strategy: 30, vitality: 10 },
    proof: 'form',
    formKind: 'weeklyreview',
  },
]

/** Pool, aus dem pro Woche 2 von 3 ausgewählt werden (siehe pickRotationTemplates in engine.ts). */
export const WEEKLY_ROTATION_TEMPLATES: WeeklyTemplate[] = [
  {
    templateId: 'weekly_psych',
    title: 'Psychologie-Effekt beobachten & testen',
    desc: 'Einen Effekt (Bias, evolutionärer Antrieb) eine Woche lang immersiv beobachten UND aktiv testen. Ein Effekt, nicht fünf.',
    rewards: { influence: 60, perception: 20 },
    proof: 'form',
    formKind: 'psych',
  },
  {
    templateId: 'weekly_sparring',
    title: 'Sparring (Format A–D)',
    desc: 'Mind. 1 Sparring: A) Rollenspiel mit Menschen, B) Spiel mit verdeckter Info, C) Red-Team-Duell, D) KI-Simulation im Claude-Projekt. Pflicht: Post-Game-Review. Format D (KI) max. 2×/Monat — A/B bevorzugen.',
    rewards: { strategy: 50, influence: 30 },
    proof: 'form',
    formKind: 'sparring',
  },
  {
    templateId: 'weekly_redteam',
    title: 'Red-Team-Routine (2×)',
    desc: 'Eigenen Plan angreifen: Blue Team (Plan in 5 Sätzen) → Red Team (3 Angriffe) → Patch + Canary. 10 Minuten pro Durchlauf.',
    rewards: { strategy: 60 },
    proof: 'form',
    formKind: 'redteam',
  },
]

export interface MonthlyTemplate {
  templateId: string
  title: string
  desc: string
  rewards: Partial<Record<StatId, number>>
  proof: 'form'
  formKind: FormKind
}

export const MONTHLY_TEMPLATES: MonthlyTemplate[] = [
  {
    templateId: 'monthly_benchmark',
    title: 'Externes Scoreboard',
    desc: 'Mind. 1 gewertetes Event mit objektivem Ergebnis — Selbstbenotung zählt nicht. Rotation empfohlen: Forecasting (Metaculus) / Schach- oder Poker-Rating / freie Wahl.',
    rewards: { strategy: 60, perception: 40 },
    proof: 'form',
    formKind: 'benchmark',
  },
]

export const QUARTERLY_CAMPAIGN: MonthlyTemplate = {
  templateId: 'quarterly_campaign',
  title: 'Kampagne des Quartals definieren',
  desc: 'Der Quartals-Arc: Arena & Ziel, Gegner/Hindernisse + deren Anreize, messbare Win-Condition, die nächsten 3 Züge, Stop-Loss. Ohne Kampagne ist das Training Gym ohne Wettkampf.',
  rewards: { strategy: 50, intelligence: 30 },
  proof: 'form',
  formKind: 'campaign',
}

export const BOSS_TEMPLATE = {
  templateId: 'boss_exam',
  title: 'BOSS: White Room Exam Day',
  desc: '30 Min OODA-Speed (10 Szenarien) · 60 Min Sparring (Verhandlung/Debatte) · 60–90 Min Adversarial Game (Rating-Match) · 10 Min Review → 1 Meta-Regel + 1 Trainingsfokus.',
  rewards: { strategy: 120, intelligence: 80, strength: 50, perception: 50 } as Partial<Record<StatId, number>>,
}

export const PENALTY_QUESTS: Array<{ title: string; desc: string; rewards: Partial<Record<StatId, number>> }> = [
  {
    title: 'STRAFPROTOKOLL: Kalt-Analyse',
    desc: '15 Min schriftliches Post-Mortem: Warum verpasst? Welcher Trigger? Plus 1 konkreter Friction-Fix (Systeme statt Willenskraft) und 1 If-Then-Regel. Das System vergisst nicht.',
    rewards: { intelligence: 20, perception: 10 },
  },
  {
    title: 'STRAFPROTOKOLL: Dopamin-Fasten',
    desc: '24 Stunden komplett ohne Kurzvideos und Feeds. Die Strafe kostet Komfort, nicht Recovery.',
    rewards: { vitality: 20, intelligence: 10 },
  },
  {
    title: 'STRAFPROTOKOLL: Doppelter Abruf',
    desc: 'Diese Woche 2 zusätzliche bewusst unangenehme Situationen. Wer gestern gespart hat, zahlt mit Exposition.',
    rewards: { strength: 20, influence: 10 },
  },
  {
    title: 'STRAFPROTOKOLL: Komfort-Entzug',
    desc: '2 Minuten Kältedusche + Handy bis 12:00 stumm. Unangenehm, aber recovery-neutral.',
    rewards: { vitality: 20, strength: 10 },
  },
]

/** Modell-Bibliothek aus Dokument 02 — Auswahl für "Modell der Woche" */
export const MODEL_LIBRARY: Array<{ name: string; desc: string }> = [
  { name: 'Incentives / Principal–Agent', desc: 'Wer wofür belohnt wird, bestimmt das Verhalten.' },
  { name: 'Reputation / wiederholtes Spiel', desc: 'Langfristkosten schlagen Kurzfristgewinn.' },
  { name: 'BATNA / Verhandlungshebel', desc: 'Alternativen bestimmen Stärke, nicht Argumente.' },
  { name: 'Irreversibilität & Option Value', desc: 'Welche Option verliere ich, wenn ich jetzt X tue?' },
  { name: 'Informationsasymmetrie', desc: 'Wer weiß was? Wer blufft?' },
  { name: 'Constraints / Engpass', desc: 'Der Bottleneck ist der Hebel.' },
  { name: 'Framing', desc: 'Wer das Problem definiert, steuert die Lösungen.' },
  { name: 'Second-Order Effects', desc: '„Wenn ich das tue, was passiert als Nächstes?"' },
  { name: 'Rival Model', desc: 'Die beste Gegenhypothese zur eigenen Story (2–4 Erklärungen).' },
  { name: 'Base Rates', desc: 'Was passiert typischerweise in solchen Fällen?' },
  { name: 'Inversion', desc: 'Was würde das Problem garantiert verschlimmern? Das vermeiden.' },
  { name: 'First Principles', desc: 'Alles in Atome zerlegen, von Fakten neu aufbauen.' },
]

/** Kandidaten für den Psychologie-Effekt der Woche (Doc 03/04) */
export const PSYCH_EFFECTS: string[] = [
  'Sunk Cost Fallacy',
  'Confirmation Bias',
  'Reziprozität',
  'Social Proof',
  'Scarcity',
  'Anchoring',
  'Loss Aversion',
  'Endowment Effect',
  'Availability Bias',
  'Base Rate Neglect',
  'Commitment & Consistency',
  'Hyperbolic Discounting',
  'Status als Antrieb',
  'Sicherheit als Antrieb',
  'Zugehörigkeit als Antrieb',
]

export interface HiddenQuestDef {
  id: string
  /** Was in der UI vor Freischaltung steht */
  hint: string
  title: string
  message: string
  lore: string
  reward: { xp?: Partial<Record<StatId, number>>; theme?: 'monarch'; title?: string }
}

export const HIDDEN_QUESTS: HiddenQuestDef[] = [
  {
    id: 'hidden_streak7',
    hint: '??? — Das System beobachtet deine Beständigkeit.',
    title: 'GEHEIME QUEST ERFÜLLT: Der Wille des Monarchen',
    message: '7 Tage Streak ohne Joker. Das System erkennt deinen Willen an.',
    lore: 'Audio-Log #01 — »Die meisten brechen am dritten Tag. Nicht, weil der Körper versagt, sondern weil niemand zusieht. Du hast weitergemacht, als niemand zusah. Genau dort beginnt die eigentliche Prüfung.«',
    reward: { xp: { strength: 100, vitality: 50 }, theme: 'monarch' },
  },
  {
    id: 'hidden_calibration',
    hint: '??? — Deine Vorhersagen werden ausgewertet. Sichere Wetten zählen nicht.',
    title: 'GEHEIME QUEST ERFÜLLT: Das Auge des Orakels',
    message: '≥10 Prognosen aufgelöst, Brier ≤ 0.20, davon ≥3 echte Wetten (35–70 %). Deine Kalibrierung ist echt — nicht die Flucht in sichere Prognosen.',
    lore: 'Audio-Log #02 — »Ein Stratege redet sich nicht ein, er hätte es kommen sehen. Er schreibt es vorher auf und erträgt die Auswertung. Und er flüchtet nicht in die 95 %, wo jede Prognose gewinnt. Deine Zahlen lügen nicht mehr.«',
    reward: { xp: { perception: 120, strategy: 60 }, title: 'Orakel' },
  },
  {
    id: 'hidden_earlybird',
    hint: '??? — Die Stunde vor der Welt gehört dir.',
    title: 'GEHEIME QUEST ERFÜLLT: Schattenprotokoll',
    message: 'Training 3× vor 08:00 Uhr abgeschlossen. Das System registriert Disziplin außerhalb der Sichtbarkeit.',
    lore: 'Audio-Log #03 — »Wer trainiert, bevor die Welt wach ist, führt ein Duell, von dem der Gegner nichts weiß. Informations-Asymmetrie beginnt beim Wecker.«',
    reward: { xp: { vitality: 80, strength: 40 } },
  },
  {
    id: 'hidden_streak30',
    hint: '??? — Nur eine lange Reise enthüllt dieses Siegel.',
    title: 'GEHEIME QUEST ERFÜLLT: Souverän der Routine',
    message: '30 Tage Streak. Systeme statt Willenskraft — du bist das System geworden.',
    lore: 'Audio-Log #04 — »Willenskraft ist endlich. Du hast sie durch Architektur ersetzt. Ab hier trägt dich die Struktur, nicht die Motivation. Das ist der Unterschied zwischen einem Vorsatz und einem Betriebssystem.«',
    reward: { xp: { vitality: 150, strength: 100, strategy: 100 }, title: 'Architekt' },
  },
  {
    id: 'hidden_journal20',
    hint: '??? — Erkenntnis hinterlässt Spuren.',
    title: 'GEHEIME QUEST ERFÜLLT: Chronist des Weißen Raums',
    message: '20 Journal-Einträge verfasst. Fehler sind Daten — und du sammelst sie.',
    lore: 'Audio-Log #05 — »Es gibt keine Fehler, nur Datenpunkte. Zwanzig Einträge bedeuten zwanzig Lektionen, die andere Menschen einfach vergessen hätten.«',
    reward: { xp: { intelligence: 100, perception: 50 } },
  },
  {
    id: 'hidden_firstrank',
    hint: '??? — Der erste Aufstieg wird registriert.',
    title: 'GEHEIME QUEST ERFÜLLT: Rang-Erwachen',
    message: 'Erster Stat auf Rang E. Der Anfang ist gemacht — das Plateau kommt noch.',
    lore: 'Audio-Log #06 — »Jeder Aufstieg fühlt sich am Anfang schnell an. Merke dir dieses Gefühl. Später, auf dem Plateau, wirst du es brauchen — als Beweis, dass Fortschritt existiert.«',
    reward: { xp: { vitality: 30, strength: 30, agility: 30 } },
  },
]

/** Master-Prompt "Strategy Review (WR)" aus Dokument 02 — zum Kopieren ins Claude-Projekt */
export const MASTER_PROMPT = `Rolle: Du bist mein "White Room Strategy Examiner": kalt, präzise, adversarial.
Ziel: Maximaler Erkenntnisgewinn, nicht Zustimmung. Du suchst aktiv nach Fehlern, falschen Annahmen, fehlenden Optionen, Incentive-Problemen und langfristigen Nebenwirkungen.

Kontext über mich:
- Ich trainiere Ayanokoji-like: Prognose-Tagebuch (1/Tag), Post-Game (10 Min/Tag), OODA/Checkliste unter Zeitdruck, 1 Modell/Woche 5× anwenden, 1–2×/Woche Sparring, Psychologie/Incentives testen, plus Sport (Kraft+Ausdauer).
- Meine Absicht ist, unter Druck komplexe/adversarial Situationen elegant zu lösen und mich gegen strategische Gegner zu behaupten.

Meine aktuelle Strategie / Situation (fülle aus):
1) Domäne: (Job/Verhandlung/Sozial/Konflikt/Projekt/…)
2) Ziel (Primär): …
3) Nebenbedingungen (z.B. Reputation, Beziehung, Zeit, Legalität, Risiko): …
4) Zeithorizont: (1 Woche / 3 Monate / 1 Jahr)
5) Ressourcen/Constraints: (Zeit, Autorität, Infos, Tools, Budget, …)
6) Stakeholder & Incentives:
   - Person A: will … / Angst … / Hebel …
   - Person B: …
7) Meine aktuelle Strategie in 5–10 Bulletpoints: …
8) Meine Annahmen (mind. 5): …
9) Was ich bereits getan habe + Ergebnis/Signale: …
10) Worst-Case, wenn ich falsch liege: …

Dein Output (genau in diesem Format):
A) Diagnose in 60 Sekunden: Was ist das eigentliche Spiel? Wo ist der Engpass?
B) Red-Team: 5 Angriffe/Failure-Modes (inkl. 2, die ich übersehe).
C) Optionsschutz: Welche 3 Handlungen killen mir Optionen? Welche 3 Moves erhöhen Optionswert?
D) Incentive-Scan: Wie könnte jede relevante Person rational gegen mich spielen? Was würde sie ausnutzen?
E) Rival Models: 3 alternative Erklärungen (statt meiner Story) + was jeweils dagegen/dafür spricht.
F) Strategie-Upgrade: 3 bessere Strategien (jeweils mit: Kernidee, 3 Schritte, Stop-Loss).
G) Canary Tests: 5 schnelle Tests/Signale diese Woche, die mir zeigen ob mein Plan stimmt.
H) Messgrößen: 5 KPIs + Zielwerte + Review-Frequenz.
I) Nächste 7 Tage: ein konkreter Wochenplan (max. 5 Aufgaben), sortiert nach Hebel.
J) Kommunikation: 3 Sätze/Skripte, die ich in echten Situationen sagen kann (kurz, robust).
K) Risiko/Ethik/Reputation: Wo könnte ich langfristig Schaden anrichten? Wie reduziere ich das ohne Macht zu verlieren?

Regeln:
- Keine Floskeln. Wenn etwas Quatsch ist, sag es.
- Wenn eine Annahme schwach ist, benenne sie als schwach.
- Priorisiere High-Leverage Moves, nicht viele Ideen.
- Wenn Informationen fehlen: mache plausible Annahmen, aber markiere sie klar und gib mir 3 gezielte Fragen, die den größten Unterschied machen.`

/** Kondensierte Referenz-Inhalte der 4 Dokumente für den Codex-Screen */
export const CODEX_SECTIONS: Array<{ id: string; title: string; items: Array<{ h: string; body: string }> }> = [
  {
    id: 'kodex',
    title: '01 · Kodex & Mindset',
    items: [
      {
        h: 'Die Kern-Formel',
        body: 'Innen (Entscheidung): stoische Basis, rational der beste Move. Außen (Ausführung): Jan-Modus — angenehme Kälte, subtile Ironie, Leichtigkeit. Wer nur gewinnen will, vergisst zu leben; wer nur Spaß will, verliert das Spiel.',
      },
      {
        h: 'Die 4 Säulen',
        body: '1) Informations-Asymmetrie: niemals zeigen, wie viel du weißt. 2) Emotionales Decoupling: Gefühle sind Sensoren, keine Lenkräder. 3) Radikale Flexibilität: Loyalität nur zum Ziel, nie zur Methode. 4) Ockhams Skalpell: die einfachste Lösung, die das Ziel erreicht.',
      },
      {
        h: 'Emotionen als Sensoren',
        body: 'Filterfrage vor jeder Handlung: „Reagiere ich gerade — oder agiere ich?" Wut fühlen ja, aus Wut handeln nie. Scham/Angst als Datensatz analysieren, Freude als Belohnungssystem nutzen, Ärger in Fokus umwandeln.',
      },
      {
        h: 'Nutzens-Gleichung',
        body: 'Vor jeder Handlung: Bringt es mich näher ans Ziel? Erhöht es Stabilität/Vergnügen ohne das Ziel zu gefährden? Was kostet es (Zeit, Energie, Ruf, Aufmerksamkeit)? Wenn nur Impuls → lassen.',
      },
      {
        h: 'Validation ist ein Bug',
        body: 'Anerkennung ist eine externe Ressource — wer davon abhängt, ist steuerbar. Shift: nicht „Ich hoffe, sie finden das intelligent", sondern „War das die effizienteste Methode?" Delayed Gratification: Reaktion genießen dürfen, nicht brauchen.',
      },
      {
        h: 'Grenzen: Kompetenz-Wärme & das 1 %',
        body: 'Hohe Kompetenz + niedrige Wärme = Neid (Gefahrenzone). Hohe Kompetenz + hohe Wärme = Bewunderung. Default: Anreize ehrlich alignen, Wert liefern. 99 % der Welt mit kühler Logik behandeln, um beim 1 % (Partner, Familie, Leidenschaft) menschlich und irrational sein zu können.',
      },
      {
        h: 'Hardware & Umgebung',
        body: 'Der Körper ist die Hardware. Systeme statt Willenskraft (Friction-Design: Schädliches hochreibig, Nützliches griffbereit). Dopamin-Hygiene: kein endloses Kurzvideo-Scrollen. Selbstgewählte Härte schüttet Dopamin aus; erzwungene erzeugt Leiden.',
      },
    ],
  },
  {
    id: 'strategie',
    title: '02 · Strategisches Denken',
    items: [
      {
        h: 'Die Big 4 (laufen immer)',
        body: 'Inversion: Was würde es garantiert verschlimmern? · Second-Order: Und was kommt danach? · Anreiz-Check: Zeig mir die Anreize, ich zeige dir das Ergebnis. · First Principles: „Warum?" bis nur Fakten übrig sind.',
      },
      {
        h: 'Schnell-Checkliste (10–30 Sek)',
        body: 'Frame → Ziel → Engpass → Irreversibel → 3 Optionen (lösen / Zeit kaufen / Info gewinnen) → Annahme + Test → Stop-Loss. Ultrakurz: Spiel? Optionen? Anreize?',
      },
      {
        h: 'Strategie-Template (geplante Züge)',
        body: '1 Umgebung & Regeln · 2 Problem präzise (W-Fragen) · 3 Motivationen aller Beteiligten · 4 Spieltheorie/Szenarien · 5 Hindernisse (2./3. Ordnung, dominante Variable) · 6 Mehrere Lösungen + Backups · 7 Kill-Rule & Proof-Rule (ab ~70 % entscheiden) · 8 Präzise umsetzen, flexibel bleiben · 9 Post-Mortem + If-Then-Regel.',
      },
      {
        h: 'Move-Design',
        body: 'Commitment Moves bewusst wählen (frühe Commitments killen Optionen) · Incentive-Shifting statt Überzeugen · Sequencing: Reihenfolge schlägt Inhalt · Rückwärtsplanen vom Zielzustand · Deterrence: Wahrnehmung steuern (Poker-Prinzip) · Pattern-Katalog statt Neuplanen.',
      },
      {
        h: 'Red Team & Canary',
        body: 'Blue Team: Plan in 5 Sätzen → Red Team: 3 Angriffe eines klugen Gegners → Patch: 1–2 Anpassungen + Canary (frühes Warnsignal). 2–3×/Woche, 10 Minuten.',
      },
      {
        h: 'Logik & Deduktion',
        body: 'Fakt/Meinung/Argument trennen · Steelmanning · These–Evidenz–Unsicherheit · Bayesianisch denken (35/65 statt 50/50) · Sherlock: Wahrnehmung → Abweichung von der Baseline → Wissensbasis → Hypothese testen. Ständig Vorhersagen treffen und prüfen.',
      },
    ],
  },
  {
    id: 'sozial',
    title: '03 · Menschen lesen',
    items: [
      {
        h: 'Opponent Modeling (4 Kernfragen)',
        body: 'Ziele: Was will X wirklich? · Constraints: Was kann X nicht tun? · Anreize: Wofür lohnt es sich? · Risiken: Was kostet es, wer muss das Gesicht wahren?',
      },
      {
        h: 'Big-5-Verzerrungen',
        body: 'Sunk Cost · Confirmation Bias · Reziprozität · Social Proof · Scarcity. Wichtigste Anwendung: bei dir selbst erkennen und gegensteuern.',
      },
      {
        h: 'Jan-Modus-Checkliste',
        body: 'Energie-Check: Verbrauche ich mehr emotionale Energie als mein Gegenüber? · Informations-Check: Habe ich mehr preisgegeben als erfahren? · Frame-Check: Bestimme ich den Ton — oder werde ich hineingezogen?',
      },
      {
        h: 'Souveränität',
        body: 'Blick 1–2 Sek länger halten · 2-Sekunden-Pause ertragen · absolute Ruhe im Körper · Stimme am Satzende tief · nicht rechtfertigen: Fakten, dann Gegenfrage zum Ziel. Strategische Passivität: nicht jede Lücke füllen.',
      },
      {
        h: 'Baseline-Predictor',
        body: 'Sprechtempo entspannt? Lieblingsthema? Vermeidungsthema? Dann unerwartetes Thema einstreuen — die Abweichung von der Baseline ist die Information.',
      },
      {
        h: 'Verteidigung (Meta-Detektor)',
        body: 'Bei Druckgefühl: „Welcher Trigger wird gerade bedient?" Zeitdruck → Scarcity · Geschenk → Reziprozitäts-Falle · „Alle machen das" → Social Proof · Schmeichelei → Ego-Fütterung. Standardantwort: Zeit kaufen — „Ich entscheide das bis morgen."',
      },
    ],
  },
  {
    id: 'training',
    title: '04 · Trainingssystem',
    items: [
      {
        h: 'Tägliche Praxis',
        body: 'Prognose-Tagebuch (1/Tag): Was passiert? p in %? Warum? — schonungslos auswerten. Post-Game (10 Min): 6 Kernfragen + 30-Sek-Rehearsal. Minimal-Kalibrierung: 1 Zahl/Tag.',
      },
      {
        h: 'Wöchentliche Praxis',
        body: '1 Modell × 5 Anwendungen (Nr. 5 = Falsifikation) · 1 Psychologie-Effekt testen · 1–2 Sparrings (KI max. 2×/Monat) · 2–3 unangenehme Situationen · 1 Vertrauens-Invest (Wärme-Rep) · Red-Team 2–3× · Weekly Review sonntags. Monatlich: 1 externes Scoreboard (Metaculus / Schach / Poker).',
      },
      {
        h: 'OODA-Speed (Fallback)',
        body: '60 Sek: Frame → Engpass → 3 Optionen → bester Zug. 30 Sek: Optionsschutz + 1 Frage. 10 Sek: Stop-Loss — nicht eskalieren, nicht committen.',
      },
      {
        h: 'Sparring-Formate',
        body: 'A) Rollenspiel mit echten Menschen (bester Transfer) · B) Poker/Social Deduction (Bluff, Bayes, Tilt) · C) Red-Team-Duell schriftlich · D) KI-Simulation ([SZENARIO]-Modus im Claude-Projekt).',
      },
      {
        h: 'Benchmarks & Exam Day',
        body: 'Pipeline: 1 Adversarial Game mit Rating + 1 Live-Kommunikation + 1 Komplexität unter Zeitdruck. White Room Exam Day 1×/Quartal. Reality-Check: Scores zählen nur mit Transfer in den Alltag.',
      },
      {
        h: 'Anti-Overkill',
        body: 'Kein endlos komplexes Journal, keine 50 Modelle auf einmal, Manipulation nie als Standardmodus. Wenn Recovery bricht, bricht „Genialität" als erstes. Lieber 5 Min als gar nicht.',
      },
    ],
  },
  {
    id: 'kampagne',
    title: '06 · Kampagne & Netzwerk',
    items: [
      {
        h: 'Der Quartals-Arc',
        body: 'Training ohne Kampagne ist Gym ohne Wettkampf. Pro Quartal: Arena & Ziel · Gegner/Hindernisse + deren Anreize · messbare Win-Condition · die nächsten 3 Züge · Stop-Loss. Prognosen, Red-Teams und Sparrings docken an die laufende Kampagne an; das Weekly Review prüft den Fortschritt.',
      },
      {
        h: 'Menschen-Portfolio',
        body: '5–10 Schlüsselkontakte mit Rollen: Informant · Türöffner · Mentor · ebenbürtiger Sparringspartner. Lücken-Analyse: Welche Rolle ist unbesetzt? Pflege = 1 Vertrauens-Invest pro Woche (Wärme-Rep) — echter Gefallen, Warm-Intro, ehrliches Interesse ohne Agenda.',
      },
      {
        h: 'Offensive Informationsbeschaffung',
        body: 'Vor relevanten Gesprächen/Verhandlungen: 10-Min-Dossier statt live raten — Ziele, Constraints, Anreize, Risiken des Gegenübers. Der Vorsprung wird vor der Konfrontation aufgebaut, nicht in ihr.',
      },
      {
        h: 'Wärme als Schutzschild',
        body: 'Hohe Kompetenz + niedrige Wärme = Neid-Zone. Der wöchentliche Vertrauens-Invest ist kein Soft-Skill-Dekor, sondern schließt die teuerste Flanke des Systems.',
      },
    ],
  },
]

export const POSTGAME_QUESTIONS = [
  'Was war das echte Ziel?',
  'Was war mein Default-Impuls?',
  'Welche Annahme hatte ich?',
  'Rival Model: Was ist die alternative Erklärung?',
  'Bester nächster Zug (ein Satz)?',
  'If-Then-Regel: Wenn [Trigger], dann [Verhalten].',
]

export const WEEKLYREVIEW_QUESTIONS = [
  'Scoreboard: Prognosen, Sparrings, Checklisten, Sozial-Situationen, Sport — was steht?',
  'Meta-Regel der Woche: Wenn [Trigger], dann [Move], weil [Prinzip].',
  'Nächstes Modell + Psychologie-Effekt (größter Engpass zuerst)?',
  'Nächstes Sparring-Szenario (Setting · Ziel · Nebenbedingung · Gegner-Vorteil · Win-Condition)?',
  '1 Real-Life-Move, 2 Einsätze nächste Woche?',
  'Kampagnen-Check: Hat die Woche auf die Win-Condition eingezahlt? Nächster Zug?',
]

export const REDTEAM_QUESTIONS = [
  'Blue Team: Dein Plan in 5 Sätzen.',
  'Red Team: 3 Angriffe / Failure-Modes eines klugen Gegners.',
  'Patch: 1–2 Anpassungen + 1 Canary (frühes Warnsignal).',
]

export const SPARRING_QUESTIONS = [
  'Format & Szenario (A: Rollenspiel · B: verdeckte Info · C: Red-Team-Duell · D: KI-Simulation)?',
  'Ergebnis: Win / Lose / Draw — und warum?',
  'Welche Annahme war falsch? Was ist die Lektion?',
]

export const UNCOMFORTABLE_QUESTIONS = [
  'Situation: Was hast du getan (Grenze, Nachfrage, Zeit gekauft, Priorität erzwungen)?',
  'Wie hat dein Körper reagiert — und was hast du trotzdem gesagt?',
  'Outcome + If-Then-Regel daraus?',
]

export const PSYCH_QUESTIONS = [
  'Welcher Effekt? Wo hast du ihn beobachtet (konkret)?',
  'Wie hast du ihn getestet?',
  'Gegenmaßnahme bei dir selbst + 1 Exploit/Defense?',
]

export const MODEL_QUESTIONS = [
  'Welches Modell? Fasse es in einem Satz.',
  'Die 5 Anwendungen: je 1 Satz — Anwendung 5 ist die Pflicht-Falsifikation (wo passt das Modell NICHT oder führt in die Irre?).',
  'Was hat es sichtbar gemacht, das du sonst übersehen hättest?',
]

export const WARMTH_QUESTIONS = [
  'Was hast du investiert (Gefallen, Warm-Intro, ehrliches Interesse — ohne Agenda)?',
  'Wie war die Reaktion?',
  'Was sagt es über die Beziehung — und welche Rolle spielt die Person in deinem Portfolio (Informant, Türöffner, Mentor, Sparringspartner)?',
]

export const BENCHMARK_QUESTIONS = [
  'Welche Schiene + welches Event (Metaculus-Frage, Schach-/Poker-Partie, anderes gewertetes Format)?',
  'Objektives Ergebnis / Score (Zahl, Rating, Auflösung — nicht dein Gefühl)?',
  'Lektion + wann ist der nächste Eintritt?',
]

export const CAMPAIGN_QUESTIONS = [
  'Arena & Ziel des Quartals (ein konkretes reales Spielfeld, z. B. Agentur-Aufbau)?',
  'Gegner/Hindernisse — und deren Anreize?',
  'Messbare Win-Condition (woran erkennst du objektiv den Sieg)?',
  'Die nächsten 3 Züge?',
  'Stop-Loss / Kill-Rule (wann brichst du ab oder planst neu)?',
]
