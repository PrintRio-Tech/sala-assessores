import type { KeyboardEvent, MouseEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, ConfirmDialog, Heading, ICONS, PersonDetailedCell, Text, useToast } from '@print/ui'

import { useSession } from '@/application/modules/Auth/hooks/use-session'
import { useDeleteRelease } from '@/application/modules/Release/hooks/use-delete-release'
import type { Release } from '@/application/modules/Release/hooks/use-releases'
import { canManageRelease } from '@/application/modules/Release/utils/release-ownership'
import { getReleaseBodyPreview } from '@/application/modules/Release/presentation/release-labels'
import { Icon } from '@/ui/components/DsIcon'
import { ROUTES } from '@/ui/routes/paths'

import { formatReleaseListDate } from '../../constants'
import { ReleaseListCardActions } from '../ReleaseListCardActions'
import { ReleaseStatusBadge } from '../ReleaseStatusBadge'

import styles from './styles.module.scss'

type ReleaseListCardProps = {
  release: Release
  onOpen: () => void
}

const MAX_VISIBLE_TAGS = 2

export function ReleaseListCard({ release, onOpen }: ReleaseListCardProps) {
  const toast = useToast()
  const navigate = useNavigate()
  const { session } = useSession()
  const canManage = canManageRelease(session?.id, release.authorUserId)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { remove, isPending: isDeleting } = useDeleteRelease({
    onSuccess: () => {
      setDeleteDialogOpen(false)
      toast.success('Release excluído', 'O comunicado foi removido.')
    },
    onError: () => {
      toast.error('Não foi possível excluir', 'Tente novamente em instantes.')
    },
  })

  const dateLabel = formatReleaseListDate(release.publishedAt)
  const summary = getReleaseBodyPreview(release.body)
  const visibleTags = release.tags.slice(0, MAX_VISIBLE_TAGS)
  const hiddenTagCount = release.tags.length - visibleTags.length

  const stopPropagation = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <>
      <Card variant="elevated" padding="sm" interactive className={styles.card}>
        <div className={styles.topRow}>
          <div className={styles.badges}>
            <ReleaseStatusBadge status={release.status} />
            {visibleTags.map((tag) => (
              <Badge key={tag} tone="secondary">{tag}</Badge>
            ))}
            {hiddenTagCount > 0 ? <Badge tone="neutral">+{hiddenTagCount}</Badge> : null}
          </div>

          <ReleaseListCardActions
            className={styles.actions}
            canManage={canManage}
            onEdit={() => navigate(ROUTES.releaseEdit(release.id))}
            onDelete={() => setDeleteDialogOpen(true)}
            onPointerDown={stopPropagation}
            onClick={stopPropagation}
          />
        </div>

        <div
          className={styles.openArea}
          role="button"
          tabIndex={0}
          aria-label={`Abrir release ${release.title}`}
          onClick={onOpen}
          onKeyDown={handleKeyDown}
        >
          <div className={styles.body}>
            <Heading level={3} className={styles.title}>{release.title}</Heading>
            <Text as="p" variant="bodyMd" tone="muted" className={styles.subtitle}>{release.subtitle}</Text>
            {summary ? (
              <Text as="p" variant="bodyMd" tone="muted" className={styles.summary}>{summary}</Text>
            ) : null}
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerFields}>
              <div className={styles.footerField}>
                <Text as="span" variant="labelSm" tone="muted" className={styles.fieldLabel}>Publicação</Text>
                <Text as="span" variant="labelSm" className={styles.date}>
                  <Icon src={ICONS.datePicker.calendar} size={14} aria-hidden />
                  {dateLabel}
                </Text>
              </div>

              <div className={styles.footerField} onClick={stopPropagation} onPointerDown={stopPropagation}>
                <Text as="span" variant="labelSm" tone="muted" className={styles.fieldLabel}>Responsável</Text>
                {release.authorName ? (
                  <PersonDetailedCell name={release.authorName} />
                ) : (
                  <Text as="span" variant="labelSm" tone="muted">—</Text>
                )}
              </div>
            </div>

            <div className={styles.footerActions}>
              <span className={styles.arrow} aria-hidden="true">
                <Icon src={ICONS.home.arrowForward} size={18} />
              </span>
            </div>
          </footer>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir release?"
        description="Esta ação não pode ser desfeita. O comunicado será removido permanentemente."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        loading={isDeleting}
        onConfirm={() => remove(release.id)}
      />
    </>
  )
}
