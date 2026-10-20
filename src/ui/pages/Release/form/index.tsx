import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ConfirmDialog, Text, useToast } from '@print/ui'

import { useSession } from '@/application/modules/Auth/hooks/use-session'
import { currentUser } from '@/application/current-user'
import { useCreateRelease } from '@/application/modules/Release/hooks/use-create-release'
import { useDeleteRelease } from '@/application/modules/Release/hooks/use-delete-release'
import { useRelease } from '@/application/modules/Release/hooks/use-release'
import { useUpdateRelease } from '@/application/modules/Release/hooks/use-update-release'
import { useReleaseFilters } from '@/application/modules/Release/stores/release.store'
import { canManageRelease } from '@/application/modules/Release/utils/release-ownership'
import {
  createInitialReleaseFormValues,
  releaseFormValuesToNewRelease,
  releaseFormValuesToUpdate,
  releaseToReleaseFormValues,
  validateReleaseForm,
  type ReleaseFormValues,
} from '@/application/modules/Release/utils/release-form-values'
import { ROUTES } from '@/ui/routes/paths'

import { ReleaseFormEditor } from './components/ReleaseFormEditor'
import { ReleaseFormHeader } from './components/ReleaseFormHeader'
import { RELEASE_FORM_ID, ReleaseFormSidebar } from './components/ReleaseFormSidebar'

import styles from './styles.module.scss'

export function ReleaseFormPage() {
  const navigate = useNavigate()
  const { id: editingReleaseId } = useParams<{ id?: string }>()
  const isEdit = Boolean(editingReleaseId)
  const toast = useToast()
  const { session } = useSession()
  const setSelectedReleaseId = useReleaseFilters((state) => state.setSelectedReleaseId)

  const { release: editingRelease, isLoading: isLoadingRelease } = useRelease(
    editingReleaseId ?? null,
    { enabled: isEdit && Boolean(editingReleaseId) },
  )

  const authorId = session?.id ?? currentUser.id
  const canManage = !isEdit || canManageRelease(authorId, editingRelease?.authorUserId ?? '')
  const isLoadingForm = isEdit && isLoadingRelease && !editingRelease
  const isNotFound = isEdit && !isLoadingRelease && !editingRelease
  const isForbidden = isEdit && Boolean(editingRelease) && !canManage
  const showForm = (!isEdit || Boolean(editingRelease)) && canManage

  const formKey = showForm ? (isEdit ? editingReleaseId! : 'create-new') : null
  const formInitialValues = isEdit && editingRelease
    ? releaseToReleaseFormValues(editingRelease)
    : createInitialReleaseFormValues()

  const [values, setValues] = useState<ReleaseFormValues>(formInitialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeFormKey, setActiveFormKey] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  if (formKey !== activeFormKey) {
    setActiveFormKey(formKey)
    if (formKey) {
      setValues(formInitialValues)
      setErrors({})
    }
  }

  const handleBack = () => {
    navigate(ROUTES.releases)
  }

  const { create, isPending: isCreating } = useCreateRelease({
    onSuccess: (release) => {
      setSelectedReleaseId(release.id)
      toast.success('Release criado', 'O comunicado foi salvo com sucesso.')
      navigate(ROUTES.releases)
    },
    onError: () => {
      toast.error('Não foi possível criar', 'Revise os campos e tente novamente.')
    },
  })

  const { update, isPending: isUpdating } = useUpdateRelease({
    onSuccess: () => {
      toast.success('Release atualizado', 'As alterações foram salvas.')
      navigate(ROUTES.releases)
    },
    onError: () => {
      toast.error('Não foi possível salvar', 'Revise os campos e tente novamente.')
    },
  })

  const { remove, isPending: isDeleting } = useDeleteRelease({
    onSuccess: () => {
      setDeleteDialogOpen(false)
      setSelectedReleaseId(null)
      toast.success('Release excluído', 'O comunicado foi removido.')
      navigate(ROUTES.releases)
    },
    onError: () => {
      toast.error('Não foi possível excluir', 'Tente novamente em instantes.')
    },
  })

  const isPending = isCreating || isUpdating || isDeleting
  const pageTitle = isEdit ? 'Editar release' : 'Criar release'
  const submitLabel = isEdit ? 'Salvar alterações' : 'Criar release'

  const handleChange = (patch: Partial<ReleaseFormValues>) => {
    setValues((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch)) delete next[key]
      return next
    })
  }

  const submitForm = () => {
    const nextErrors = validateReleaseForm(values, { isCreate: !isEdit })
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    if (isEdit && editingRelease) {
      update({
        id: editingRelease.id,
        input: releaseFormValuesToUpdate(values),
        journalistIds: values.journalistIds,
      })
      return
    }

    create(releaseFormValuesToNewRelease(values, {
      id: authorId,
      name: session?.name || currentUser.name,
    }))
  }

  if (isLoadingForm) {
    return (
      <div className={styles.state}>
        <Text as="p" variant="bodyMd" tone="muted" aria-live="polite">Carregando release…</Text>
      </div>
    )
  }

  if (isNotFound) {
    return (
      <div className={styles.state}>
        <div className={styles.empty} role="alert">
          <Text as="p" variant="bodyMd">Release não encontrado.</Text>
          <Button type="button" variant="ghost" onClick={handleBack}>Voltar para releases</Button>
        </div>
      </div>
    )
  }

  if (isForbidden) {
    return (
      <div className={styles.state}>
        <div className={styles.empty} role="alert">
          <Text as="p" variant="bodyMd">Somente o autor pode editar ou excluir este release.</Text>
          <Button type="button" variant="ghost" onClick={handleBack}>Voltar para releases</Button>
        </div>
      </div>
    )
  }

  if (!showForm) return null

  return (
    <div className={styles.page}>
      <ReleaseFormHeader
        title={pageTitle}
        submitLabel={submitLabel}
        formId={RELEASE_FORM_ID}
        disabled={isPending}
        onBack={handleBack}
        onDelete={isEdit ? () => setDeleteDialogOpen(true) : undefined}
      />

      <div className={styles.workspace}>
        <div className={styles.editorColumn}>
          <ReleaseFormEditor
            title={values.title}
            subtitle={values.subtitle}
            body={values.body}
            titleError={errors.title}
            subtitleError={errors.subtitle}
            bodyError={errors.body}
            disabled={isPending}
            onTitleChange={(title) => handleChange({ title })}
            onSubtitleChange={(subtitle) => handleChange({ subtitle })}
            onBodyChange={(body) => handleChange({ body })}
          />
        </div>

        <ReleaseFormSidebar
          values={values}
          errors={errors}
          disabled={isPending}
          isEdit={isEdit}
          isPending={isPending}
          releaseId={editingReleaseId}
          onCancel={handleBack}
          onSubmit={submitForm}
          onChange={handleChange}
        />
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir release?"
        description="Esta ação não pode ser desfeita. O comunicado será removido permanentemente."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        loading={isDeleting || !editingReleaseId}
        onConfirm={() => { if (editingReleaseId) remove(editingReleaseId) }}
      />
    </div>
  )
}
