import { Button, Icon, ICONS, Text } from '@print/ui'

import type { PositioningAttachment } from '@/domain/Demand/demand.entity'
import { formatFileSize } from './positioning-file'
import styles from './positioning-attachment.module.scss'

export function PositioningAttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: PositioningAttachment
  onRemove?: () => void
}) {
  return (
    <div className={styles.chip} data-testid="positioning-attachment">
      <Icon src={ICONS.home.article} size={20} aria-hidden />
      <div className={styles.meta}>
        <Text as="span" variant="labelMd">{attachment.filename}</Text>
        <Text as="span" variant="labelSm" tone="muted">{formatFileSize(attachment.sizeBytes)}</Text>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={`Baixar ${attachment.filename}`}
        onClick={() => window.open(attachment.objectUrl, '_blank', 'noopener')}
      >
        <Icon src={ICONS.ui.download} size={16} aria-hidden />
      </Button>
      {onRemove ? (
        <Button type="button" variant="ghost" size="sm" iconOnly aria-label="Remover arquivo" onClick={onRemove}>
          <Icon src={ICONS.table.delete} size={16} aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
