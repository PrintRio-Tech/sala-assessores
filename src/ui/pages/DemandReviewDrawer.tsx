import { useEffect, useId, useState, type FormEvent } from 'react'
import { Button, DrawerShell, SelectField, Text, TextInput } from '@print/ui'

import styles from './demand-action-drawers.module.scss'

export type DemandReviewInput = { reviewerId: string; version: string }
export type DemandReviewDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: DemandReviewInput) => void
  reviewerOptions: Array<{ value: string; label: string }>
  initialValue?: Partial<DemandReviewInput>
  isPending?: boolean
  error?: Error | null
}

export function DemandReviewDrawer({ open, onOpenChange, onSubmit, reviewerOptions, initialValue, isPending = false, error }: DemandReviewDrawerProps) {
  const formId = useId()
  const [reviewerId, setReviewerId] = useState(initialValue?.reviewerId ?? '')
  const [version, setVersion] = useState(initialValue?.version ?? '')
  useEffect(() => { if (open) { setReviewerId(initialValue?.reviewerId ?? ''); setVersion(initialValue?.version ?? '') } }, [open, initialValue])
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ reviewerId, version: version.trim() }) }

  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} title="Solicitar review" description="Encaminhe uma versão identificada para revisão." size="md" contentLayout="scroll" presentation="layer" origin="end" responsiveOrigin="bottom" closeLabel="Fechar solicitação de review" footer={<div className={styles.footerActions}><Button className={styles.footerAction} type="button" variant="ghost" disabled={isPending} onClick={() => onOpenChange(false)}>Cancelar</Button><Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>{isPending ? 'Solicitando…' : 'Solicitar review'}</Button></div>}>
      <form id={formId} className={styles.form} aria-label="Solicitação de review" onSubmit={submit}><SelectField label="Revisor" name="reviewerId" contained required placeholder="Selecione" options={reviewerOptions} value={reviewerId} onValueChange={setReviewerId} /><TextInput label="Versão para review" name="version" required value={version} onChange={(event) => setVersion(event.target.value)} />{error ? <Text as="p" variant="labelSm" tone="error" role="alert">{error.message}</Text> : null}</form>
    </DrawerShell>
  )
}
