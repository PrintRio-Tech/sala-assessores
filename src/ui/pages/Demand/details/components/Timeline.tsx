import { Badge, Button } from '@print/ui'

import type { DemandDetailTimelineEvent } from '@/application/modules/Demand/presentation/demand-detail.viewmodel'
import { PositioningAttachmentChip } from '../../components/PositioningAttachmentChip'
import styles from '../styles.module.scss'

export function Timeline({
  events,
  onReadPositioning,
}: {
  events: DemandDetailTimelineEvent[]
  onReadPositioning?: (versionId: string) => void
}) {
  return (
    <div className={styles.timeline}>
      {events.map((event) => (
        <article key={event.id} className={`${styles.timelineEvent} ${event.isAttention ? styles.attention : ''} ${event.isCurrent ? styles.current : ''}`}>
          <i className={styles.timelineDot} />
          <div className={styles.timelineMeta}>{event.actor ? <strong>{event.actor}</strong> : null}<small>{event.attribution}</small></div>
          <time dateTime={event.iso}>{event.dateLabel}<small>{event.timeLabel}</small></time>
          <h3>{event.title}</h3>
          {event.kind === 'positioning_version' ? (
            <div className={styles.timelinePositioning}>
              <div className={styles.tagList}>
                {event.hasBody ? <Badge tone="secondary" size="sm">Texto</Badge> : null}
                {event.attachment ? <Badge tone="secondary" size="sm">Anexo</Badge> : null}
              </div>
              {event.attachment ? <PositioningAttachmentChip attachment={event.attachment} /> : null}
              {event.description ? <p>{event.description}</p> : null}
              {event.isTruncated && onReadPositioning ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onReadPositioning(event.id)}>
                  Ler completo
                </Button>
              ) : null}
            </div>
          ) : (
            event.description ? <p>{event.description}</p> : null
          )}
          {event.nextStep ? <footer><b>Próximo passo registrado</b>{event.nextStep}</footer> : null}
        </article>
      ))}
    </div>
  )
}
