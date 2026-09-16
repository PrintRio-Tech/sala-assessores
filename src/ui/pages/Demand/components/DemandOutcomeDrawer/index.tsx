import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  Button,
  DrawerShell,
  Rating,
  SelectField,
  Text,
  Textarea,
} from '@print/ui'

import {
  DEMAND_OUTCOME_PUBLISHED,
  DEMAND_OUTCOME_PUBLISHED_LABELS,
  DEMAND_OUTCOME_SCORE_MAX,
  DEMAND_OUTCOME_SCORE_MIN,
  type DemandOutcomePublished,
} from '@/domain/Demand/demand.entity'
import type { RegisterDemandOutcomeInput } from '@/application/modules/Demand/hooks/use-register-demand-outcome'
import styles from './styles.module.scss'

type OutcomeValues = {
  toneScore: number | null
  published: DemandOutcomePublished | ''
  usageScore: number | null
  resultSummary: string
}

type OutcomeErrors = Partial<Record<keyof OutcomeValues, string>>

const publishedOptions = DEMAND_OUTCOME_PUBLISHED.map((value) => ({
  value,
  label: DEMAND_OUTCOME_PUBLISHED_LABELS[value],
}))

function emptyValues(): OutcomeValues {
  return { toneScore: null, published: '', usageScore: null, resultSummary: '' }
}

function valuesFromInitial(initial?: RegisterDemandOutcomeInput | null): OutcomeValues {
  if (!initial) return emptyValues()
  return {
    toneScore: initial.toneScore,
    published: initial.published,
    usageScore: initial.usageScore,
    resultSummary: initial.resultSummary,
  }
}

function validate(values: OutcomeValues): OutcomeErrors {
  const errors: OutcomeErrors = {}
  if (values.toneScore == null) errors.toneScore = 'Informe o tom da matéria (1 a 5).'
  if (!values.published) errors.published = 'Informe se foi publicado.'
  if (values.usageScore == null) errors.usageScore = 'Informe como o material foi aproveitado (1 a 5).'
  if (!values.resultSummary.trim()) errors.resultSummary = 'Descreva o que aconteceu nesta pauta.'
  return errors
}

export type DemandOutcomeDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegister: (input: RegisterDemandOutcomeInput) => void
  initialValues?: RegisterDemandOutcomeInput | null
  hasJournalistLink?: boolean
  isPending?: boolean
  error?: Error | null
}

export function DemandOutcomeDrawer({
  open,
  onOpenChange,
  onRegister,
  initialValues = null,
  hasJournalistLink = true,
  isPending = false,
  error,
}: DemandOutcomeDrawerProps) {
  const formId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<OutcomeValues>(() => valuesFromInitial(initialValues))
  const [errors, setErrors] = useState<OutcomeErrors>({})
  const isEdit = Boolean(initialValues)

  const reset = useCallback(() => {
    setValues(valuesFromInitial(initialValues))
    setErrors({})
  }, [initialValues])

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  function update<Key extends keyof OutcomeValues>(key: Key, value: OutcomeValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    const firstError = (['toneScore', 'published', 'usageScore', 'resultSummary'] as const)
      .find((key) => nextErrors[key])
    if (firstError) {
      window.setTimeout(() => {
        if (firstError === 'toneScore' || firstError === 'usageScore') {
          const field = formRef.current?.querySelector(`[name="${firstError}"]`)
          if (field instanceof HTMLElement) field.focus()
          return
        }
        const field = formRef.current?.elements.namedItem(firstError)
        if (field instanceof HTMLElement) field.focus()
      }, 0)
      return
    }

    onRegister({
      toneScore: values.toneScore!,
      published: values.published as DemandOutcomePublished,
      usageScore: values.usageScore!,
      resultSummary: values.resultSummary.trim(),
    })
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset()
        onOpenChange(nextOpen)
      }}
      title={isEdit ? 'Editar avaliação' : 'Avaliar resultado'}
      description="Registre o tom, a publicação e o aproveitamento do material nesta pauta."
      size="lg"
      contentLayout="scroll"
      presentation="layer"
      origin="end"
      responsiveOrigin="bottom"
      closeLabel="Fechar avaliação"
      footer={(
        <div className={styles.footerActions}>
          <Button className={styles.footerAction} type="button" variant="ghost" disabled={isPending} onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>
            {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar avaliação'}
          </Button>
        </div>
      )}
    >
      <form ref={formRef} id={formId} className={styles.form} aria-label="Avaliação do resultado da pauta" noValidate onSubmit={submit}>
        <div className={styles.evaluationNotice} role="note">
          <Text as="p" variant="labelSm">
            <strong>Registro manual:</strong> esta avaliação fica no caso
            {hasJournalistLink
              ? ' e aparece no perfil do jornalista ligada a esta pauta.'
              : '. Ela só aparece no perfil depois que o jornalista for cadastrado ou vinculado.'}
          </Text>
        </div>
        <fieldset className={styles.section}>
          <legend>Resultado observado</legend>
          <Rating
            label="Qual foi o tom da matéria?"
            name="toneScore"
            required
            max={DEMAND_OUTCOME_SCORE_MAX}
            minLabel="Hostil"
            maxLabel="Colaborativo"
            value={values.toneScore}
            error={errors.toneScore}
            onValueChange={(value) => {
              if (value >= DEMAND_OUTCOME_SCORE_MIN && value <= DEMAND_OUTCOME_SCORE_MAX) {
                update('toneScore', value)
              }
            }}
          />
          <SelectField
            label="Foi publicado?"
            name="published"
            contained
            required
            value={values.published}
            options={[{ value: '', label: 'Selecione' }, ...publishedOptions]}
            error={errors.published}
            onValueChange={(value) => update('published', value as DemandOutcomePublished | '')}
          />
          <Rating
            label="Como o material foi aproveitado?"
            name="usageScore"
            required
            max={DEMAND_OUTCOME_SCORE_MAX}
            minLabel="Distorceu / não usou"
            maxLabel="Uso positivo"
            value={values.usageScore}
            error={errors.usageScore}
            onValueChange={(value) => {
              if (value >= DEMAND_OUTCOME_SCORE_MIN && value <= DEMAND_OUTCOME_SCORE_MAX) {
                update('usageScore', value)
              }
            }}
          />
          <Textarea
            label="O que aconteceu nesta pauta?"
            name="resultSummary"
            rows={4}
            required
            value={values.resultSummary}
            error={errors.resultSummary}
            onChange={(event) => update('resultSummary', event.target.value)}
          />
        </fieldset>
        {error ? <Text as="p" tone="error" className={styles.submitError}>{error.message}</Text> : null}
      </form>
    </DrawerShell>
  )
}
