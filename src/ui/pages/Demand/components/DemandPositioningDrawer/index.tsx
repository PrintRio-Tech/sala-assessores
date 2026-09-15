import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Button, ConfirmDialog, DrawerShell, FormField, Text, Textarea } from '@print/ui'

import { useSavePositioning } from '@/application/modules/Demand/hooks/use-save-positioning'
import type { PositioningAttachment } from '@/domain/Demand/demand.entity'
import { PositioningAttachmentChip } from '../PositioningAttachmentChip'
import { fileToAttachment, revokeAttachmentUrl } from '../positioning-file'
import styles from './styles.module.scss'

export type DemandPositioningDrawerProps = {
  demandId: string
  demandCode: string
  demandTitle: string
  initialBody: string
  initialAttachment?: PositioningAttachment | null
  mode?: 'edit' | 'view'
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DemandPositioningDrawer({
  demandId,
  demandCode,
  demandTitle,
  initialBody,
  initialAttachment = null,
  mode = 'edit',
  open,
  onOpenChange,
}: DemandPositioningDrawerProps) {
  const [body, setBody] = useState(initialBody)
  const [attachment, setAttachment] = useState<PositioningAttachment | null>(initialAttachment)
  const [ownedUrl, setOwnedUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [discardOpen, setDiscardOpen] = useState(false)
  const skipDirtyCloseRef = useRef(false)
  const wasOpenRef = useRef(false)
  const formId = useId()
  const fileId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const baselineBodyRef = useRef(initialBody)
  const baselineAttachmentRef = useRef(initialAttachment)
  const bodyRef = useRef(initialBody)
  const attachmentRef = useRef(initialAttachment)

  const resetAll = useCallback(() => {
    setBody(initialBody)
    bodyRef.current = initialBody
    baselineBodyRef.current = initialBody
    setAttachment(initialAttachment)
    attachmentRef.current = initialAttachment
    baselineAttachmentRef.current = initialAttachment
    setOwnedUrl(null)
    setError('')
  }, [initialAttachment, initialBody])

  const { save, isPending, error: mutationError, reset: resetMutation } = useSavePositioning(demandId, {
    onSuccess: () => {
      skipDirtyCloseRef.current = true
      baselineBodyRef.current = bodyRef.current
      baselineAttachmentRef.current = attachmentRef.current
      setError('')
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      resetAll()
      resetMutation()
      skipDirtyCloseRef.current = false
    }
    wasOpenRef.current = open
  }, [open, resetAll, resetMutation])

  const dirty = body !== baselineBodyRef.current || attachment?.objectUrl !== baselineAttachmentRef.current?.objectUrl
  const isView = mode === 'view'

  const closeNow = () => {
    skipDirtyCloseRef.current = false
    setDiscardOpen(false)
    onOpenChange(false)
    if (ownedUrl) revokeAttachmentUrl({ filename: '', contentType: '', sizeBytes: 0, objectUrl: ownedUrl })
    resetAll()
  }

  const requestClose = () => {
    if (isView || skipDirtyCloseRef.current) {
      closeNow()
      return
    }
    if (dirty) {
      setDiscardOpen(true)
      return
    }
    closeNow()
  }

  const replaceAttachment = (file: File | null) => {
    if (ownedUrl) revokeAttachmentUrl({ filename: '', contentType: '', sizeBytes: 0, objectUrl: ownedUrl })
    if (!file) {
      setAttachment(null)
      attachmentRef.current = null
      setOwnedUrl(null)
      setError('')
      return
    }
    const next = fileToAttachment(file)
    setAttachment(next)
    attachmentRef.current = next
    setOwnedUrl(next.objectUrl)
    setError('')
    if (mutationError) resetMutation()
  }

  const submit = () => {
    const trimmed = body.trim()
    if (!trimmed && !attachment) {
      setError('Inclua o arquivo, o texto, ou os dois.')
      formRef.current?.querySelector<HTMLTextAreaElement>('[name="body"]')?.focus()
      return
    }
    setError('')
    save({ body: trimmed, attachment })
  }

  const title = isView
    ? 'Posicionamento'
    : (initialBody.trim() || initialAttachment ? 'Atualizar posicionamento' : 'Escrever posicionamento')

  return (
    <>
      <DrawerShell
        open={open}
        onOpenChange={(nextOpen) => nextOpen ? onOpenChange(true) : requestClose()}
        title={title}
        description={isView
          ? `${demandCode} · ${demandTitle}`
          : `${demandCode} · ${demandTitle}. Texto, anexo ou os dois. A versão atual aparece no detalhe e no histórico.`}
        size="lg"
        presentation="layer"
        origin="end"
        closeLabel="Fechar posicionamento"
        footer={(
          <div className={styles.footerActions}>
            {isView ? (
              <Button className={styles.footerAction} type="button" variant="ghost" onClick={requestClose}>Fechar</Button>
            ) : (
              <>
                <Button className={styles.footerAction} type="button" variant="ghost" onClick={requestClose}>Cancelar</Button>
                <Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>Salvar versão</Button>
              </>
            )}
          </div>
        )}
      >
        {isView ? (
          <div className={styles.form}>
            {attachment ? <PositioningAttachmentChip attachment={attachment} /> : null}
            {body.trim() ? <Text as="p" className={styles.sourceContext}>{body}</Text> : null}
          </div>
        ) : (
          <form ref={formRef} id={formId} className={styles.form} onSubmit={(event) => { event.preventDefault(); submit() }}>
            <FormField
              htmlFor={fileId}
              label="Anexo do posicionamento"
              description="PDF, Word ou imagem. Opcional se houver texto."
            >
              <input
                id={fileId}
                className={styles.fileInput}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                aria-label="Anexo do posicionamento"
                onChange={(event) => {
                  replaceAttachment(event.target.files?.[0] ?? null)
                  event.target.value = ''
                }}
              />
              <div className={styles.fileActions}>
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(fileId)?.click()}>
                  Escolher arquivo
                </Button>
              </div>
            </FormField>
            {attachment ? (
              <PositioningAttachmentChip attachment={attachment} onRemove={() => replaceAttachment(null)} />
            ) : null}
            <Textarea
              aria-label="Texto do posicionamento"
              label="Texto do posicionamento"
              name="body"
              rows={8}
              value={body}
              error={error || undefined}
              onChange={(event) => {
                bodyRef.current = event.target.value
                setBody(event.target.value)
                setError('')
                if (mutationError) resetMutation()
              }}
            />
            {mutationError ? <Text as="p" variant="labelSm" tone="error" className={styles.submitError} role="alert">{mutationError.message}</Text> : null}
          </form>
        )}
      </DrawerShell>
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Descartar alterações?"
        description="O que ainda não foi salvo será perdido."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        destructive
        onConfirm={closeNow}
      />
    </>
  )
}
