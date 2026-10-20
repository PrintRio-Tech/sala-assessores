import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '@base-ui-components/react/dialog'
import { Badge, Button, ConfirmDialog, Text, useToast } from '@print/ui'

import { useSession } from '@/application/modules/Auth/hooks/use-session'
import { useDeleteRelease } from '@/application/modules/Release/hooks/use-delete-release'
import { useRelease } from '@/application/modules/Release/hooks/use-release'
import { canManageRelease } from '@/application/modules/Release/utils/release-ownership'
import { ROUTES } from '@/ui/routes/paths'

import { ReleaseDetailActions } from '../ReleaseDetailActions'
import { ReleaseDocument } from '../ReleaseDocument'

import styles from './styles.module.scss'

type ReleaseViewSheetProps = {
  releaseId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReleaseViewSheet({ releaseId, open, onOpenChange }: ReleaseViewSheetProps) {
  const toast = useToast()
  const navigate = useNavigate()
  const { session } = useSession()
  const { release, isLoading } = useRelease(open ? releaseId : null)
  const canManage = canManageRelease(session?.id, release?.authorUserId ?? '')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { remove, isPending: isDeleting } = useDeleteRelease({
    onSuccess: () => {
      setDeleteDialogOpen(false)
      onOpenChange(false)
      toast.success('Release excluído', 'O comunicado foi removido.')
    },
    onError: () => {
      toast.error('Não foi possível excluir', 'Tente novamente em instantes.')
    },
  })

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.backdrop} />
          <Dialog.Popup className={styles.sheet} aria-label="Visualização do release">
            <header className={styles.header}>
              <div className={styles.tags}>
                {release?.tags.map((tag, index) => (
                  <Badge key={tag} tone={index % 2 === 0 ? 'accent' : 'secondary'}>{tag}</Badge>
                ))}
              </div>

              <div className={styles.headerActions}>
                {release ? (
                  <ReleaseDetailActions
                    canManage={canManage}
                    onEdit={() => {
                      onOpenChange(false)
                      navigate(ROUTES.releaseEdit(release.id))
                    }}
                    onDelete={() => setDeleteDialogOpen(true)}
                  />
                ) : null}

                <Dialog.Close
                  render={
                    <Button type="button" variant="ghost" size="sm" iconOnly className={styles.closeButton} aria-label="Fechar visualização">
                      ×
                    </Button>
                  }
                />
              </div>
            </header>

            <div className={styles.body}>
              {isLoading && !release ? (
                <Text as="p" variant="bodyMd" tone="muted" aria-busy="true">Carregando release…</Text>
              ) : null}

              {release ? <ReleaseDocument release={release} authorName={release.authorName} /> : null}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {release ? (
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
      ) : null}
    </>
  )
}
