const CIVIL_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/

function calendarDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

export function tryParseCivilDate(value: string | null | undefined): Date | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const match = CIVIL_DATE_PREFIX.exec(trimmed)
  if (!match) return null
  return calendarDate(Number(match[1]), Number(match[2]), Number(match[3]))
}

export function parseCivilDate(value: string): Date {
  const date = tryParseCivilDate(value)
  if (!date) throw new RangeError(`Invalid civil date: ${value}`)
  return date
}

export function toCivilDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
