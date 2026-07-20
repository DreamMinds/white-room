/** Alle Datums-Helfer arbeiten mit lokaler Zeit; Tage als "YYYY-MM-DD". */

export function toDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(now: Date = new Date()): string {
  return toDayKey(now)
}

export function addDays(key: string, n: number): string {
  const d = fromDayKey(key)
  d.setDate(d.getDate() + n)
  return toDayKey(d)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromDayKey(b).getTime() - fromDayKey(a).getTime()) / 86400000)
}

export function monthKey(day: string): string {
  return day.slice(0, 7)
}

/** Letzter Tag des Monats, in dem `day` liegt. */
export function endOfMonth(day: string): string {
  const d = fromDayKey(day)
  return toDayKey(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

/** Erster Tag des Quartals, in dem `day` liegt. */
export function quarterStart(day: string): string {
  const d = fromDayKey(day)
  return toDayKey(new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1))
}

/** ISO-Wochen-Schlüssel, z.B. "2026-W29" */
export function weekKey(day: string): string {
  const d = fromDayKey(day)
  const target = new Date(d.getTime())
  const dayNr = (d.getDay() + 6) % 7 // Mo=0 … So=6
  target.setDate(target.getDate() - dayNr + 3) // Donnerstag der Woche
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstDayNr = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3)
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000))
  return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Sonntag (letzter Tag) der ISO-Woche, in der `day` liegt. */
export function sundayOf(day: string): string {
  const d = fromDayKey(day)
  const dayNr = (d.getDay() + 6) % 7
  return addDays(day, 6 - dayNr)
}

/** Wochentag 0=Mo … 6=So */
export function weekdayOf(day: string): number {
  return (fromDayKey(day).getDay() + 6) % 7
}

export function quarterKey(day: string): string {
  const d = fromDayKey(day)
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`
}

export function formatDay(key: string): string {
  const names = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const d = fromDayKey(key)
  return `${names[weekdayOf(key)]} ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${formatDay(toDayKey(d))} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

let idCounter = 0
export function uid(prefix: string): string {
  idCounter = (idCounter + 1) % 10000
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
