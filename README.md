# ⬢ White Room 2.0 System

Gamifizierte Trainings-App im Stil des Systems aus *Solo Leveling*: XP sammeln, Stats von Rang F bis S leveln, tägliche und wöchentliche Quests aus dem WR-2.0-Trainingssystem — und ein Strafsystem, das Versagen nicht einfach durchwinkt (3 Joker pro Monat, danach Sanktionen).

## Features

- **7 Stats** (Vitalität, Stärke, Agilität & Ausdauer, Intelligenz, Beeinflussung, Strategie, Wahrnehmung) mit Rängen **F → S**, steilen XP-Kurven und **Decay** bei Inaktivität
- **Daily Quests**: Training nach Wochenplan (Krav Maga, Calisthenics, Laufen, Plyometrics), Prognose-Tagebuch, Post-Game-Reflexion — mit Minimum-Modus („lieber 5 Min als gar nicht", 25 % XP)
- **Weekly Quests**: Modell der Woche (5×-Strichliste), Psychologie-Effekt testen, Sparring (Formate A–D), unangenehme Situationen, Red-Team-Routine, Weekly Review
- **Straf-System**: verpasster Tag → Joker (3/Monat) oder Sanktion (XP-Verlust, Streak-Reset, Strafquest, „SYSTEMFEHLER"-Overlay)
- **Proof of Work**: Foto-/Screenshot-Upload (lokal in IndexedDB) oder Pflicht-Texteintrag — kein 1-Klick-Selbstreporting
- **Hidden Quests**: geheime Trigger schalten Titel, Lore-Logs und das Monarch-Theme frei
- **Journal**: Erkenntnisse, Prognosen (mit Auflösung + Kalibrierungs-Quote), If-Then-Regeln, Meta-Regeln — **Export als Markdown** + JSON-Vollbackup/-Import
- **Claude-Sparringspartner**: Projekt-Link speichern, direkt aus Sparring-Quests öffnen, Master-Prompt „Strategy Review (WR)" per Klick kopieren
- **Codex**: die kondensierten Inhalte der 4 WR-2.0-Dokumente als In-App-Referenz
- **PWA**: installierbar auf dem Handy, läuft offline, alle Daten bleiben lokal auf dem Gerät

## Entwicklung

```bash
npm install
npm run dev       # Dev-Server
npm run build     # Produktions-Build (dist/)
npm run preview   # Build lokal testen
node e2e-check.mjs  # End-to-End-Check (erst preview auf Port 4173 starten)
```

Stack: Vite · React · TypeScript · Tailwind CSS v4 · Zustand (persist) · idb-keyval · vite-plugin-pwa

## Installation auf dem Handy

Build auf einem beliebigen statischen Host deployen, Seite im Browser öffnen → „Zum Startbildschirm hinzufügen". Die App läuft danach offline; Daten liegen in localStorage/IndexedDB des Geräts (Backup-Export unter **System → Daten** nutzen!).

## Deployment (VPS)

Live unter **https://system.janbanick.de** (hinter Basic-Auth), analog zu food-/luzid-/endmyopia-janbanick.

- nginx-alpine-Container serviert statisch aus `./html` (Port `127.0.0.1:8289`), Routing + TLS + Basic-Auth über Traefik (siehe `docker-compose.yml`).
- Kein Backend: alle Daten bleiben lokal im Browser des Geräts.
- Basic-Auth-Hash steht **nicht** im Repo, sondern in der gitignorten `docker-compose.override.yml` (Vorlage: `docker-compose.override.yml.example`).

**Deploy-Ablauf** (auf dem VPS-Verzeichnis, gekoppelt per Deploy-Key an `DreamMinds/white-room`):

```bash
git pull --ff-only
npm ci
npm run build
rm -rf html && mv dist html
docker compose up -d --force-recreate whiteroom-site
```

`--force-recreate` ist Pflicht, sonst bind-mountet der laufende nginx-Container die alte Inode von `html/` (→ 403).
