import type { PositioningAttachment } from '@/domain/Demand/demand.entity'

export function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileToAttachment(file: File): PositioningAttachment {
  return {
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    objectUrl: URL.createObjectURL(file),
  }
}

export function revokeAttachmentUrl(attachment: PositioningAttachment | null | undefined) {
  if (attachment?.objectUrl.startsWith('blob:')) URL.revokeObjectURL(attachment.objectUrl)
}
