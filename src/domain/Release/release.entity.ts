export const RELEASE_STATUSES = ['in_progress', 'sent'] as const
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number]

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  in_progress: 'Em Andamento',
  sent: 'Enviado',
}

export const DEFAULT_RELEASE_STATUS: ReleaseStatus = 'in_progress'

export function isReleaseStatus(value: string): value is ReleaseStatus {
  return (RELEASE_STATUSES as readonly string[]).includes(value)
}

export interface ReleaseRecipient {
  journalistId: string
  addedAt: Date
  name: string | null
  outletName: string | null
}

export interface Release {
  id: string
  code: string
  title: string
  subtitle: string
  body: string
  status: ReleaseStatus
  tags: string[]
  publishedAt: Date | null
  authorUserId: string
  authorName: string
  recipients: ReleaseRecipient[]
  createdAt: Date
  updatedAt: Date
}

export function getReleaseStatusLabel(status: ReleaseStatus): string {
  return RELEASE_STATUS_LABELS[status]
}

export function stripReleaseHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getReleaseBodyPreview(html: string, maxLength = 180): string {
  const text = stripReleaseHtml(html)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}…`
}

export function uniqueJournalistIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const id of ids) {
    const trimmed = id.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    unique.push(trimmed)
  }
  return unique
}
