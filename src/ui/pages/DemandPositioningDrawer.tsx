import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Button, ConfirmDialog, DrawerShell, Text, Textarea } from '@print/ui'

import { useSavePositioning } from '@/application/modules/Demand/hooks/use-save-positioning'
import styles from './demand-action-drawers.module.scss'

export type DemandPositioningDrawerProps = {
  demandId: string
  demandCode: string
  demandTitle: string
  initialBody: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DemandPositioningDrawer({
  demandId,
  demandCode,
  demandTitle,
  initialBody,
  open,
  onOpenChange,
}: DemandPositioningDrawerProps) {
  const [body, setBody] = useState(initialBody)
  const [error, setError] = useState('')
  const [discardOpen, setDiscardOpen] = useState(false)
  const skipDirtyCloseRef = useRef(false)
  const wasOpenRef = useRef(false)
  const formId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const baselineRef = useRef(initialBody)

  const bodyRef = useRef(initialBody)

  const resetAll = useCallback(() => {
    setBody(initialBody)
    bodyRef.current = initialBody
    baselineRef.current = initialBody
    setError('')
  }, [initialBody])

  const { save, isPending, error: mutationError, reset: resetMutation } = useSavePositioning(demandId, {
    onSuccess: () => {
      skipDirtyCloseRef.current = true
      baselineRef.current = bodyRef.current
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

  const dirty = body !== baselineRef.current

  const closeNow = () => {
    skipDirtyCloseRef.current = false
    setDiscardOpen(false)
    onOpenChange(false)
    resetAll()
  }

  const requestClose = () => {
    if (skipDirtyCloseRef.current) {
      closeNow()
      return
    }
    if (dirty) {
      setDiscardOpen(true)
      return
    }
    closeNow()
  }

  const submit = () => {
    const trimmed = body.trim()
    if (!trimmed) {
      setError('Informe o texto do posicionamento.')
      formRef.current?.querySelector<HTMLTextAreaElement>('[name="body"]')?.focus()
      return
    }
    setError('')
    save({ body: trimmed })
  }

  return (
    <>
      <DrawerShell
        open={open}
        onOpenChange={(nextOpen) => nextOpen ? onOpenChange(true) : requestClose()}
        title={initialBody.trim() ? 'Atualizar posicionamento' : 'Escrever posicionamento'}
        description={`${demandCode} · ${demandTitle}. O texto salvo vira a versão atual e aparece no histórico.`}
        size="lg"
        presentation="layer"
        origin="end"
        closeLabel="Fechar posicionamento"
        footer={(
          <div className={styles.footerActions}>
            <Button className={styles.footerAction} type="button" variant="ghost" onClick={requestClose}>Cancelar</Button>
            <Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>Salvar versão</Button>
          </div>
        )}
      >
        <form ref={formRef} id={formId} className={styles.form} onSubmit={(event) => { event.preventDefault(); submit() }}>
          <Textarea
            aria-label="Texto do posicionamento"
            label="Texto do posicionamento"
            name="body"
            required
            rows={8}
            value={body}
            error={error}
            onChange={(event) => {
              bodyRef.current = event.target.value
              setBody(event.target.value)
              setError('')
              if (mutationError) resetMutation()
            }}
          />
          {mutationError ? <Text as="p" variant="labelSm" tone="error" className={styles.submitError} role="alert">{mutationError.message}</Text> : null}
        </form>
      </DrawerShell>
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Descartar alterações?"
        description="O texto ainda não salvo será perdido."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        destructive
        onConfirm={closeNow}
      />
    </>
  )
}
