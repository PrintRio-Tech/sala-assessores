import { Button, Heading, ICONS } from '@print/ui'

import { Icon } from '@/ui/components/DsIcon'

import styles from './styles.module.scss'

type ReleaseFormHeaderProps = {
  title: string
  submitLabel: string
  formId: string
  disabled?: boolean
  onBack: () => void
  onDelete?: () => void
}

export function ReleaseFormHeader({
  title,
  submitLabel,
  formId,
  disabled = false,
  onBack,
  onDelete,
}: ReleaseFormHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.leading}>
        <button type="button" className={styles.back} onClick={onBack}>
          <Icon src={ICONS.ui.chevronLeft} size={20} aria-hidden />
          Voltar
        </button>
        <div className={styles.titleGroup}>
          <Icon src={ICONS.nav.releases} size={24} aria-hidden />
          <Heading level={1} variant="md" className={styles.title}>{title}</Heading>
        </div>
      </div>
      <div className={styles.actions}>
        {onDelete ? (
          <Button type="button" variant="ghost" iconOnly aria-label="Excluir release" disabled={disabled} onClick={onDelete}>
            <Icon src={ICONS.table.delete} size={18} aria-hidden />
          </Button>
        ) : null}
        <Button type="submit" form={formId} disabled={disabled}>{submitLabel}</Button>
      </div>
    </header>
  )
}
