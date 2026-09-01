import { useEffect, useId, useState, type FormEvent } from 'react'
import { Button, DrawerShell, SelectField, Text, TextInput, Textarea } from '@print/ui'

import styles from './demand-action-drawers.module.scss'

export type DemandPriority = 'low' | 'normal' | 'high' | 'urgent'

export type DemandEnrichmentInput = {
  tags: string[]
  topic: string
  area: string
  confirmedFacts: string
  pendingItems: string
  responsibleId: string
  priority: DemandPriority
  nextStep: string
}

export type DemandEnrichmentDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (input: DemandEnrichmentInput) => void
  responsibleOptions: Array<{ value: string; label: string }>
  initialValue?: Partial<DemandEnrichmentInput>
  isPending?: boolean
  error?: Error | null
}

const emptyValue: DemandEnrichmentInput = { tags: [], topic: '', area: '', confirmedFacts: '', pendingItems: '', responsibleId: '', priority: 'normal', nextStep: '' }
const priorityOptions = [
  { value: 'low', label: 'Baixa' }, { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' }, { value: 'urgent', label: 'Urgente' },
]

function uniqueTags(value: string) {
  const result = new Map<string, string>()
  value.split(',').forEach((item) => {
    const tag = item.trim().replace(/\s+/g, ' ')
    if (tag && !result.has(tag.toLocaleLowerCase('pt-BR'))) result.set(tag.toLocaleLowerCase('pt-BR'), tag)
  })
  return [...result.values()]
}

export function DemandEnrichmentDrawer({ open, onOpenChange, onSave, responsibleOptions, initialValue, isPending = false, error }: DemandEnrichmentDrawerProps) {
  const formId = useId()
  const [values, setValues] = useState(() => ({ ...emptyValue, ...initialValue }))
  const [tags, setTags] = useState(() => initialValue?.tags?.join(', ') ?? '')

  useEffect(() => {
    if (open) {
      setValues({ ...emptyValue, ...initialValue })
      setTags(initialValue?.tags?.join(', ') ?? '')
    }
  }, [open, initialValue])

  const update = <K extends keyof DemandEnrichmentInput>(key: K, value: DemandEnrichmentInput[K]) => setValues((current) => ({ ...current, [key]: value }))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave({ ...values, tags: uniqueTags(tags), topic: values.topic.trim(), area: values.area.trim(), confirmedFacts: values.confirmedFacts.trim(), pendingItems: values.pendingItems.trim(), nextStep: values.nextStep.trim() })
  }

  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} title="Enriquecer demanda" description="Organize o contexto antes de avançar a demanda." size="lg" contentLayout="scroll" presentation="layer" origin="end" responsiveOrigin="bottom" closeLabel="Fechar enriquecimento" footer={<div className={styles.footerActions}><Button className={styles.footerAction} type="button" variant="ghost" disabled={isPending} onClick={() => onOpenChange(false)}>Cancelar</Button><Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>{isPending ? 'Salvando…' : 'Salvar enriquecimento'}</Button></div>}>
      <form id={formId} className={styles.form} aria-label="Enriquecimento da demanda" onSubmit={submit}>
        <fieldset className={styles.section}><legend>Classificação</legend><TextInput label="Tags" name="tags" description="Separe as tags por vírgulas." value={tags} onChange={(event) => setTags(event.target.value)} /><div className={styles.grid}><TextInput label="Tema" name="topic" value={values.topic} onChange={(event) => update('topic', event.target.value)} /><TextInput label="Área" name="area" value={values.area} onChange={(event) => update('area', event.target.value)} /></div></fieldset>
        <fieldset className={styles.section}><legend>Apuração</legend><Textarea label="Fatos confirmados" name="confirmedFacts" rows={4} value={values.confirmedFacts} onChange={(event) => update('confirmedFacts', event.target.value)} /><Textarea label="Pendências" name="pendingItems" rows={4} value={values.pendingItems} onChange={(event) => update('pendingItems', event.target.value)} /></fieldset>
        <fieldset className={styles.section}><legend>Operação</legend><div className={styles.grid}><SelectField label="Responsável" name="responsibleId" contained placeholder="Selecione" options={responsibleOptions} value={values.responsibleId} onValueChange={(value) => update('responsibleId', value)} /><SelectField label="Prioridade" name="priority" contained options={priorityOptions} value={values.priority} onValueChange={(value) => update('priority', value as DemandPriority)} /></div><Textarea label="Próximo passo" name="nextStep" rows={3} value={values.nextStep} onChange={(event) => update('nextStep', event.target.value)} /></fieldset>
        {error ? <Text as="p" variant="labelSm" tone="error" role="alert" className={styles.submitError}>{error.message}</Text> : null}
      </form>
    </DrawerShell>
  )
}
