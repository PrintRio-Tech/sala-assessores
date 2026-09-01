import { useEffect, useId, useState, type FormEvent } from 'react'
import { Button, DrawerShell, Text, TextInput, Textarea } from '@print/ui'

import styles from './demand-action-drawers.module.scss'

export type DemandDecision = 'approve' | 'request_changes' | 'reject'
export type DemandDecisionInput = { decision: DemandDecision; rationale: string; decider: string }
export type DemandDecisionDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: DemandDecisionInput) => void
  initialValue?: Partial<DemandDecisionInput>
  isPending?: boolean
  error?: Error | null
}

const decisions: Array<{ value: DemandDecision; label: string }> = [{ value: 'approve', label: 'Aprovar' }, { value: 'request_changes', label: 'Pedir ajustes' }, { value: 'reject', label: 'Reprovar' }]

export function DemandDecisionDrawer({ open, onOpenChange, onSubmit, initialValue, isPending = false, error }: DemandDecisionDrawerProps) {
  const formId = useId()
  const [decision, setDecision] = useState<DemandDecision>(initialValue?.decision ?? 'approve')
  const [decider, setDecider] = useState(initialValue?.decider ?? '')
  const [rationale, setRationale] = useState(initialValue?.rationale ?? '')
  useEffect(() => { if (open) { setDecision(initialValue?.decision ?? 'approve'); setDecider(initialValue?.decider ?? ''); setRationale(initialValue?.rationale ?? '') } }, [open, initialValue])
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ decision, decider: decider.trim(), rationale: rationale.trim() }) }

  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} title="Registrar decisão" description="Registre a decisão do review sem confundi-la com o estado da demanda." size="md" contentLayout="scroll" presentation="layer" origin="end" responsiveOrigin="bottom" closeLabel="Fechar decisão" footer={<div className={styles.footerActions}><Button className={styles.footerAction} type="button" variant="ghost" disabled={isPending} onClick={() => onOpenChange(false)}>Cancelar</Button><Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>{isPending ? 'Registrando…' : 'Registrar decisão'}</Button></div>}>
      <form id={formId} className={styles.form} aria-label="Decisão do review" onSubmit={submit}><fieldset className={styles.section}><legend>Decisão</legend><div className={styles.decisionOptions}>{decisions.map((option) => <label className={styles.decisionOption} key={option.value}><input type="radio" name="decision" value={option.value} checked={decision === option.value} onChange={() => setDecision(option.value)} />{option.label}</label>)}</div></fieldset><TextInput label="Responsável pela decisão" name="decider" required value={decider} onChange={(event) => setDecider(event.target.value)} /><Textarea label="Justificativa" name="rationale" required rows={5} value={rationale} onChange={(event) => setRationale(event.target.value)} />{error ? <Text as="p" variant="labelSm" tone="error" role="alert">{error.message}</Text> : null}</form>
    </DrawerShell>
  )
}
