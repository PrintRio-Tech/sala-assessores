import { useMemo, useRef, useState } from 'react'
import { Button, ConfirmDialog, DatePicker, SearchableSelectField, SelectField, Text, useToast } from '@print/ui'

import type { ReleaseFormValues } from '@/application/modules/Release/utils/release-form-values'
import { useJournalists } from '@/application/modules/Journalist/hooks/use-journalists'
import {
  useCommitReleaseRecipientImport,
  usePreviewReleaseRecipientImport,
  useReleaseRecipientTemplate,
} from '@/application/modules/Release/hooks/use-release-recipient-import'
import { getReleaseStatusLabel, RELEASE_STATUSES } from '@/application/modules/Release/presentation/release-labels'
import { TagInput } from '@/ui/pages/Release/components/TagInput'
import tagInputStyles from '@/ui/pages/Release/components/TagInput/styles.module.scss'
import { ReleaseFormEditorMobile } from '../ReleaseFormEditor'
import { ReleaseFormSettingsPanel } from '../ReleaseFormSettingsPanel'

import styles from './styles.module.scss'

const FORM_ID = 'release-form'

type ReleaseFormSidebarProps = {
  formId?: string
  releaseId?: string | null
  values: ReleaseFormValues
  errors: Record<string, string>
  disabled: boolean
  isEdit: boolean
  isPending: boolean
  onCancel: () => void
  onSubmit: () => void
  onChange: (patch: Partial<ReleaseFormValues>) => void
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function downloadTemplate(filename: string, contentType: string, contentBase64: string) {
  const binary = atob(contentBase64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: contentType }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ReleaseFormSidebar({
  formId = FORM_ID,
  releaseId,
  values,
  errors,
  disabled,
  isEdit,
  isPending,
  onCancel,
  onSubmit,
  onChange,
}: ReleaseFormSidebarProps) {
  const toast = useToast()
  const [journalistQuery, setJournalistQuery] = useState('')
  const [selectedJournalistId, setSelectedJournalistId] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: journalists, isLoading: journalistsLoading } = useJournalists({ search: journalistQuery })
  const { template } = useReleaseRecipientTemplate()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<{ filename: string; contentBase64: string } | null>(null)

  const { preview, data: previewData, isPending: isPreviewing, reset: resetPreview } = usePreviewReleaseRecipientImport({
    onSuccess: () => setPreviewOpen(true),
    onError: (error) => {
      toast.error('Use o modelo oficial. Baixe o template.', error.message)
    },
  })

  const { commit, isPending: isCommitting } = useCommitReleaseRecipientImport({
    onSuccess: (release) => {
      setPreviewOpen(false)
      setPendingFile(null)
      resetPreview()
      onChange({ journalistIds: release.recipients.map((item) => item.journalistId) })
      toast.success('Destinatários atualizados', 'A planilha foi importada.')
    },
    onError: (error) => {
      toast.error('Use o modelo oficial. Baixe o template.', error.message)
    },
  })

  const journalistOptions = useMemo(
    () => journalists
      .filter((journalist) => !values.journalistIds.includes(journalist.id))
      .map((journalist) => ({
        value: journalist.id,
        label: `${journalist.name} — ${journalist.outletName}`,
      })),
    [journalists, values.journalistIds],
  )

  const selectedJournalists = useMemo(
    () => values.journalistIds.map((id) => {
      const journalist = journalists.find((item) => item.id === id)
      return { id, name: journalist?.name ?? id, outletName: journalist?.outletName ?? '' }
    }),
    [journalists, values.journalistIds],
  )

  const statusOptions = RELEASE_STATUSES.map((value) => ({
    value,
    label: getReleaseStatusLabel(value),
  }))

  const handleDownload = () => {
    if (!template) return
    downloadTemplate(template.filename, template.contentType, template.contentBase64)
  }

  const handleImportFile = async (file: File) => {
    if (!releaseId) return
    const contentBase64 = await fileToBase64(file)
    setPendingFile({ filename: file.name, contentBase64 })
    preview({ releaseId, filename: file.name, contentBase64 })
  }

  return (
    <aside className={styles.sidebar} aria-label="Configurações do release">
      <form
        id={formId}
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <ReleaseFormEditorMobile
          title={values.title}
          subtitle={values.subtitle}
          body={values.body}
          titleError={errors.title}
          subtitleError={errors.subtitle}
          bodyError={errors.body}
          disabled={disabled}
          onTitleChange={(title) => onChange({ title })}
          onSubtitleChange={(subtitle) => onChange({ subtitle })}
          onBodyChange={(body) => onChange({ body })}
        />

        <ReleaseFormSettingsPanel title="Configurações">
          <div className={styles.fields}>
            <TagInput
              tags={values.tags}
              disabled={disabled}
              hideHint
              layout="stacked"
              label="Tags"
              required={!isEdit}
              error={errors.tags}
              onChange={(tags) => onChange({ tags })}
            />

            <SelectField
              label="Status"
              name="release-status"
              contained
              options={statusOptions}
              value={values.status}
              disabled={disabled}
              onValueChange={(value) => onChange({ status: value as ReleaseFormValues['status'] })}
            />

            <DatePicker
              label="Data de publicação"
              name="release-published-date"
              hideHint
              placeholder="Selecione"
              value={values.publishedDate}
              disabled={disabled}
              onValueChange={(value) => onChange({ publishedDate: value })}
            />

            <SearchableSelectField
              label="Destinatários"
              name="release-recipients"
              contained
              options={journalistOptions}
              value={selectedJournalistId}
              selectedLabel={undefined}
              disabled={disabled}
              loading={journalistsLoading}
              placeholder="Buscar jornalista…"
              emptyMessage="Nenhum jornalista encontrado."
              error={errors.journalistIds}
              onQueryChange={setJournalistQuery}
              onValueChange={(value) => {
                if (!value || values.journalistIds.includes(value)) {
                  setSelectedJournalistId('')
                  return
                }
                onChange({ journalistIds: [...values.journalistIds, value] })
                setSelectedJournalistId('')
                setJournalistQuery('')
              }}
            />

            {selectedJournalists.length > 0 ? (
              <div className={tagInputStyles.chipsExternal} aria-label="Destinatários selecionados">
                {selectedJournalists.map((journalist) => (
                  <span key={journalist.id} className={tagInputStyles.chip}>
                    <Text as="span" variant="labelSm">
                      {journalist.outletName ? `${journalist.name} — ${journalist.outletName}` : journalist.name}
                    </Text>
                    <button
                      type="button"
                      className={tagInputStyles.chipRemove}
                      aria-label={`Remover destinatário ${journalist.name}`}
                      disabled={disabled}
                      onClick={() => onChange({ journalistIds: values.journalistIds.filter((id) => id !== journalist.id) })}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className={styles.importActions}>
              <Button type="button" variant="outline" size="sm" disabled={disabled || !template} onClick={handleDownload}>
                Baixar modelo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || !releaseId || isPreviewing}
                onClick={() => fileInputRef.current?.click()}
              >
                Importar planilha
              </Button>
              <input
                ref={fileInputRef}
                className={styles.fileInput}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                aria-label="Arquivo de destinatários"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void handleImportFile(file)
                }}
              />
            </div>
          </div>
        </ReleaseFormSettingsPanel>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>Cancelar</Button>
          <Button type="submit" disabled={isPending}>{isEdit ? 'Salvar alterações' : 'Criar release'}</Button>
        </div>
      </form>

      <ConfirmDialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open)
          if (!open) {
            setPendingFile(null)
            resetPreview()
          }
        }}
        title="Importar destinatários?"
        description={previewData
          ? `${previewData.matchedCount} já cadastrados, ${previewData.createCount} a criar, ${previewData.errorCount} erros.`
          : undefined}
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        loading={isCommitting}
        onConfirm={() => {
          if (!releaseId || !pendingFile) return
          commit({ releaseId, ...pendingFile })
        }}
      />
    </aside>
  )
}

export { FORM_ID as RELEASE_FORM_ID }
