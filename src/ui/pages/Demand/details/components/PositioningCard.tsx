import { Button, Card, Heading, Text } from '@print/ui'

import type { DemandDetailViewModel } from '@/application/modules/Demand/presentation/demand-detail.viewmodel'
import { PositioningAttachmentChip } from '../../components/PositioningAttachmentChip'
import styles from '../styles.module.scss'

export function PositioningCard({
  positioning,
  onWrite,
  onReadMore,
}: {
  positioning: DemandDetailViewModel['positioning']
  onWrite: () => void
  onReadMore: () => void
}) {
  return (
    <Card variant="surface" padding="lg" className={`${styles.infoCard} ${styles.positioning}`} data-testid="demand-positioning">
      <div className={styles.positioningHeader}>
        <Heading level={2} variant="sm">Posicionamento</Heading>
        {positioning.canEdit ? (
          <Button type="button" variant="outline" size="sm" onClick={onWrite}>
            {positioning.writeLabel}
          </Button>
        ) : null}
      </div>
      {positioning.isEmpty ? (
        <Text as="p">Ainda sem resposta</Text>
      ) : (
        <>
          {positioning.attachment ? <PositioningAttachmentChip attachment={positioning.attachment} /> : null}
          {positioning.hasBody ? (
            <Text as="p" className={styles.positioningBody}>{positioning.body}</Text>
          ) : null}
        </>
      )}
      {positioning.approval ? (
        <Text as="p" variant="labelSm" tone="muted">
          Aprovado por {positioning.approval.approvedBy}
          {positioning.approval.opinion ? ` · ${positioning.approval.opinion}` : ''}
        </Text>
      ) : null}
      {positioning.hasBody && positioning.isTruncated ? (
        <div className={styles.positioningActions}>
          <Button type="button" variant="ghost" size="sm" onClick={onReadMore}>
            Ler completo
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
