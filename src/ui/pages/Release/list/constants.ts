import { getReleaseStatusLabel, RELEASE_STATUSES, type ReleaseStatus } from '@/application/modules/Release/presentation/release-labels'

export const FILTER_ALL_VALUE = '__all__'

export const RELEASE_STATUS_OPTIONS = RELEASE_STATUSES.map((value) => ({
  value,
  label: getReleaseStatusLabel(value),
}))

export function withFilterAllOption<T extends { value: string; label: string }>(
  options: T[],
  allLabel: string,
) {
  return [{ value: FILTER_ALL_VALUE, label: allLabel }, ...options]
}

export { getReleaseStatusLabel }
export type { ReleaseStatus }

export function formatReleaseListDate(date: Date | null): string {
  if (!date) return '—'

  const parts = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(date)

  const day = parts.find((part) => part.type === 'day')?.value ?? ''
  const month = (parts.find((part) => part.type === 'month')?.value ?? '').replace('.', '')
  const year = parts.find((part) => part.type === 'year')?.value ?? ''

  return `${day} ${month.toUpperCase()} ${year}`
}

export function formatReleaseCardDate(date: Date | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatReleaseDateTime(date: Date | null): string {
  if (!date) return '—'
  const datePart = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)
  return `${datePart} • ${timePart}`
}
