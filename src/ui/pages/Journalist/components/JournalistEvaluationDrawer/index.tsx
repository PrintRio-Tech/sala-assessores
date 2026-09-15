import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  Button,
  DatePicker,
  DrawerShell,
  SelectField,
  Text,
  Textarea,
  TextInput,
} from '@print/ui'

import type { RelationshipEvaluationInput } from '@/application/modules/Journalist/hooks/use-register-relationship-evaluation'
import styles from '../JournalistCreateDrawer/styles.module.scss'

type EvaluationValues = {
  score: string
  editorialToneLabel: string
  traits: string
  notes: string
  authorName: string
  recordedAt: string
}

type EvaluationErrors = Partial<Record<'score' | 'editorialToneLabel' | 'authorName' | 'recordedAt', string>>

const toneOptions = [
  { value: '', label: 'Selecione o tom observado' },
  { value: 'Questionador / Crítico', label: 'Questionador / Crítico' },
  { value: 'Imparcial / Analítico', label: 'Imparcial / Analítico' },
  { value: 'Favorável / Colaborativo', label: 'Favorável / Colaborativo' },
]

function todayIsoDate() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function initialValues(): EvaluationValues {
  return { score: '', editorialToneLabel: '', traits: '', notes: '', authorName: '', recordedAt: todayIsoDate() }
}

function validate(values: EvaluationValues): EvaluationErrors {
  const errors: EvaluationErrors = {}
  const score = Number(values.score)
  if (!values.score || !Number.isFinite(score) || score < 1 || score > 5) errors.score = 'Informe uma nota entre 1 e 5.'
  if (!values.editorialToneLabel) errors.editorialToneLabel = 'Informe o tom editorial observado.'
  if (!values.authorName.trim()) errors.authorName = 'Informe o autor do registro.'
  if (!values.recordedAt) errors.recordedAt = 'Informe a data do registro.'
  return errors
}

function parseTraits(value: string): string[] {
  const unique = new Map<string, string>()
  for (const item of value.split(',')) {
    const normalized = item.trim().replace(/\s+/g, ' ')
    const key = normalized.toLocaleLowerCase('pt-BR')
    if (normalized && !unique.has(key)) unique.set(key, normalized)
  }
  return [...unique.values()]
}

export type JournalistEvaluationDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegister: (input: RelationshipEvaluationInput) => void
  isPending?: boolean
  error?: Error | null
}

export function JournalistEvaluationDrawer({
  open,
  onOpenChange,
  onRegister,
  isPending = false,
  error,
}: JournalistEvaluationDrawerProps) {
  const formId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<EvaluationValues>(initialValues)
  const [errors, setErrors] = useState<EvaluationErrors>({})

  const reset = useCallback(() => {
    setValues(initialValues())
    setErrors({})
  }, [])

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  function update<Key extends keyof EvaluationValues>(key: Key, value: EvaluationValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    const firstError = (['score', 'editorialToneLabel', 'authorName', 'recordedAt'] as const).find((key) => nextErrors[key])
    if (firstError) {
      window.setTimeout(() => {
        const field = formRef.current?.elements.namedItem(firstError)
        if (field instanceof HTMLElement) field.focus()
      }, 0)
      return
    }

    onRegister({
      score: Number(values.score),
      editorialToneLabel: values.editorialToneLabel,
      traits: parseTraits(values.traits),
      notes: values.notes.trim(),
      authorName: values.authorName.trim(),
      recordedAt: new Date(`${values.recordedAt}T12:00:00`),
    })
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset()
        onOpenChange(nextOpen)
      }}
      title="Registrar avaliação"
      description="Documente uma percepção observada, com autoria e data."
      size="lg"
      contentLayout="scroll"
      presentation="layer"
      origin="end"
      responsiveOrigin="bottom"
      closeLabel="Fechar avaliação"
      footer={(
        <div className={styles.footerActions}>
          <Button className={styles.footerAction} type="button" variant="ghost" disabled={isPending} onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>{isPending ? 'Registrando…' : 'Registrar avaliação'}</Button>
        </div>
      )}
    >
      <form ref={formRef} id={formId} className={styles.form} aria-label="Registro de avaliação de jornalista" noValidate onSubmit={submit}>
        <div className={styles.evaluationNotice} role="note">
          <Text as="p" variant="labelSm"><strong>Avaliação registrada:</strong> este é um registro manual e datado; não é um fato inferido pelo sistema.</Text>
        </div>
        <fieldset className={styles.section}>
          <legend>Avaliação observada</legend>
          <div className={styles.grid}>
            <TextInput autoFocus label="Nota de relacionamento" name="score" type="number" min="1" max="5" step="0.1" required value={values.score} error={errors.score} onChange={(event) => update('score', event.target.value)} />
            <SelectField label="Tom editorial observado" name="editorialToneLabel" contained required value={values.editorialToneLabel} options={toneOptions} error={errors.editorialToneLabel} onValueChange={(value) => update('editorialToneLabel', value)} />
          </div>
          <TextInput label="Traços observados" name="traits" description="Separe múltiplos traços por vírgulas." value={values.traits} onChange={(event) => update('traits', event.target.value)} />
          <Textarea label="Observações" name="notes" rows={5} value={values.notes} onChange={(event) => update('notes', event.target.value)} />
        </fieldset>
        <fieldset className={styles.section}>
          <legend>Autoria do registro</legend>
          <div className={styles.grid}>
            <TextInput label="Autor do registro" name="authorName" required value={values.authorName} error={errors.authorName} onChange={(event) => update('authorName', event.target.value)} />
            <DatePicker label="Data do registro" name="recordedAt" required value={values.recordedAt} error={errors.recordedAt} onValueChange={(value) => update('recordedAt', value)} />
          </div>
        </fieldset>
        {error ? <Text as="p" variant="labelSm" tone="error" role="alert" className={styles.submitError}>{error.message}</Text> : null}
      </form>
    </DrawerShell>
  )
}
