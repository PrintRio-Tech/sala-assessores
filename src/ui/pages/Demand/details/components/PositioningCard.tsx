import { Badge, Button, Card, Heading, Text } from '@print/ui'

import type { DemandDetailViewModel } from '@/application/modules/Demand/presentation/demand-detail.viewmodel'
import styles from '../styles.module.scss'

export function PositioningCard({
  positioning,
  onWrite,
}: {
  positioning: DemandDetailViewModel['positioning']
  onWrite: () => void
}) {
  return (
    <Card variant="surface" padding="lg" className={`${styles.infoCard} ${styles.positioning}`} data-testid="demand-positioning">
      <div className={styles.positioningHeader}>
        <Heading level={2} variant="sm">Posicionamento</Heading>
        <Badge tone={positioning.state === 'empty' ? 'neutral' : positioning.state === 'approved' || positioning.state === 'sent' ? 'primary' : 'secondary'} size="sm">
          {positioning.stateLabel}
        </Badge>
      </div>
      {positioning.isEmpty ? (
        <Text as="p">Ainda sem resposta</Text>
      ) : (
        <Text as="p" className={styles.positioningBody}>{positioning.body}</Text>
      )}
      {positioning.approval ? (
        <Text as="p" variant="labelSm" tone="muted">
          Aprovado por {positioning.approval.approvedBy}
          {positioning.approval.opinion ? ` · ${positioning.approval.opinion}` : ''}
        </Text>
      ) : null}
      {positioning.canEdit && positioning.isEmpty ? (
        <div className={styles.positioningActions}>
          <Button type="button" variant="outline" size="sm" onClick={onWrite}>
            {positioning.writeLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
