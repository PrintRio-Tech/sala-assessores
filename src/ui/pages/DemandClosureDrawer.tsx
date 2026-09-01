import { useEffect, useId, useState, type FormEvent } from 'react'
import { Button, Checkbox, DrawerShell, Text, Textarea } from '@print/ui'

import styles from './demand-action-drawers.module.scss'

export type DemandClosureInput = { reason: string }
export type DemandClosureDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (input: DemandClosureInput) => void
  initialReason?: string
  isPending?: boolean
  error?: Error | null
}

export function DemandClosureDrawer({ open, onOpenChange, onConfirm, initialReason = '', isPending = false, error }: DemandClosureDrawerProps) {
  const formId = useId()
  const [reason, setReason] = useState(initialReason)
  const [confirmed, setConfirmed] = useState(false)
  useEffect(() => { if (open) { setReason(initialReason); setConfirmed(false) } }, [open, initialReason])
  const submit = (event: FormEvent) => { event.preventDefault(); if (confirmed) onConfirm({ reason: reason.trim() }) }

  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} title="Encerrar sem envio" description="Encerre a demanda mantendo o motivo registrado no histórico." size="md" contentLayout="scroll" presentation="layer" origin="end" responsiveOrigin="bottom" closeLabel="Fechar encerramento" footer={<div className={styles.footerActions}><Button className={styles.footerAction} type="button" variant="ghost" disabled={isPending} onClick={() => onOpenChange(false)}>Cancelar</Button><Button className={styles.footerAction} form={formId} type="submit" disabled={!confirmed || isPending}>{isPending ? 'Encerrando…' : 'Encerrar sem envio'}</Button></div>}>
      <form id={formId} className={styles.form} aria-label="Encerramento sem envio" onSubmit={submit}><Textarea autoFocus label="Motivo do encerramento" name="reason" required rows={5} value={reason} onChange={(event) => setReason(event.target.value)} /><Checkbox name="confirmClosure" checked={confirmed} onCheckedChange={setConfirmed} label="Confirmo o encerramento sem envio" />{error ? <Text as="p" variant="labelSm" tone="error" role="alert">{error.message}</Text> : null}</form>
    </DrawerShell>
  )
}
