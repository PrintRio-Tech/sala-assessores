import type { DemandDetailTimelineEvent } from '@/application/modules/Demand/presentation/demand-detail.viewmodel'
import styles from '../styles.module.scss'

export function Timeline({ events }: { events: DemandDetailTimelineEvent[] }) {
  return (
    <div className={styles.timeline}>
      {events.map((event) => (
        <article key={event.id} className={`${styles.timelineEvent} ${event.isAttention ? styles.attention : ''} ${event.isCurrent ? styles.current : ''}`}>
          <i className={styles.timelineDot} />
          <div className={styles.timelineMeta}>{event.actor ? <strong>{event.actor}</strong> : null}<small>{event.attribution}</small></div>
          <time dateTime={event.iso}>{event.dateLabel}<small>{event.timeLabel}</small></time>
          <h3>{event.title}</h3>
          {event.description ? <p>{event.description}</p> : null}
          {event.nextStep ? <footer><b>Próximo passo registrado</b>{event.nextStep}</footer> : null}
        </article>
      ))}
    </div>
  )
}
