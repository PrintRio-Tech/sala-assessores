import { Link } from 'react-router-dom'
import { ActionGroup, Badge, Button, Heading, Icon, ICONS, Text } from '@print/ui'

import type { DemandDetailViewModel } from '@/application/modules/Demand/presentation/demand-detail.viewmodel'
import { ROUTES } from '@/ui/routes/paths'
import styles from '../styles.module.scss'

export function DetailHeader({
  demand,
  onWritePositioning,
  onRegisterInteraction,
  onEdit,
  onDelete,
}: {
  demand: DemandDetailViewModel
  onWritePositioning: () => void
  onRegisterInteraction: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const writeIsPrimary = demand.positioning.primaryAction === 'write_positioning'
  return (
    <header className={styles.detailHeader}>
      <ActionGroup align="between" className={styles.toolbar}>
        <Link to={ROUTES.demands} className={styles.back}>
          <Icon src={ICONS.ui.chevronLeft} size={20} aria-hidden />
          Voltar para demandas
        </Link>
        <ActionGroup aria-label="Ações da demanda">
          {demand.canWritePositioning ? (
            <Button
              type="button"
              variant={writeIsPrimary ? 'primary' : 'outline'}
              size="sm"
              onClick={onWritePositioning}
            >
              {demand.positioning.writeLabel}
            </Button>
          ) : null}
          {demand.canRegisterInteraction ? (
            <Button
              type="button"
              variant={writeIsPrimary ? 'outline' : 'primary'}
              size="sm"
              onClick={onRegisterInteraction}
            >
              Registrar interação
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" iconOnly aria-label="Editar" onClick={onEdit}>
            <Icon src={ICONS.table.edit} size={16} aria-hidden />
          </Button>
          <Button type="button" variant="outline" size="sm" iconOnly aria-label="Excluir" onClick={onDelete}>
            <Icon src={ICONS.table.delete} size={16} aria-hidden />
          </Button>
        </ActionGroup>
      </ActionGroup>
      <div className={styles.headerIdentity}>
        <Heading level={1}>{demand.identity.title}</Heading>
        <Text as="div" variant="bodyMd" tone="muted" className={styles.supportLine}>
          {demand.identity.code ? <span>{demand.identity.code}</span> : null}
          <Badge tone="neutral" size="sm">{demand.identity.statusLabel}</Badge>
        </Text>
      </div>
    </header>
  )
}
