import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Badge, Button, Card, Checkbox, ConfirmDialog, DatePicker, DrawerShell, isValidTime, SelectField, Text, TextInput, Textarea, TimeInput } from '@print/ui'

import {
  interactionResultRules,
  useRegisterInteraction,
  validateInteractionResultFields,
  type RegisterInteractionInput,
} from '@/application/modules/Demand/hooks/use-register-interaction'
import styles from './demand-interaction-drawer.module.scss'

type InteractionType = NonNullable<RegisterInteractionInput['type']>
type InteractionResult = RegisterInteractionInput['result']
type FormValues = {
  occurredDate: string
  occurredTime: string
  type: InteractionType | ''
  result: InteractionResult | ''
  participants: string
  summary: string
  nextStep: string
  channel: string
  recipient: string
  body: string
}
type FormErrors = Partial<Record<keyof FormValues | 'confirmed', string>>
type SaveMode = 'close' | 'repeat'

const typeOptions = [
  { value: 'phone', label: 'Telefonema' },
  { value: 'email', label: 'E-mail' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'legal_consult', label: 'Consulta jurídica' },
  { value: 'other', label: 'Outro contato' },
]

const resultOptions = Object.entries(interactionResultRules).map(([value, rule]) => ({ value, label: rule.label }))

function toLocalDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toLocalTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function fromLocalDateTimeValues(dateValue: string, timeValue: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue)
  if (!dateMatch || !isValidTime(timeValue)) return new Date(Number.NaN)
  const [hour, minute] = timeValue.split(':').map(Number)
  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const date = new Date(year, month - 1, day, hour, minute)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return new Date(Number.NaN)
  }
  return date
}

function initialValues(): FormValues {
  const now = new Date()
  return {
    occurredDate: toLocalDateValue(now),
    occurredTime: toLocalTimeValue(now),
    type: '',
    result: '',
    participants: '',
    summary: '',
    nextStep: '',
    channel: '',
    recipient: '',
    body: '',
  }
}

function closesCase(result: InteractionResult | '') {
  return result === 'response_sent' || result === 'closed_without_send'
}

function validate(values: FormValues, confirmed: boolean): FormErrors {
  const errors: FormErrors = {}
  if (!values.result) errors.result = 'Informe o resultado da interação.'
  if (!values.occurredDate) errors.occurredDate = 'Informe a data.'
  if (!values.occurredTime) errors.occurredTime = 'Informe o horário.'
  else if (!isValidTime(values.occurredTime)) errors.occurredTime = 'Informe um horário válido.'
  if (values.occurredDate && Number.isNaN(fromLocalDateTimeValues(values.occurredDate, isValidTime(values.occurredTime) ? values.occurredTime : '00:00').getTime())) {
    errors.occurredDate = 'Informe uma data válida.'
  }
  if (values.result) Object.assign(errors, validateInteractionResultFields(values.result, values))
  if (values.result === 'closed_without_send' && !confirmed) {
    errors.confirmed = 'Confirme o encerramento sem resposta enviada.'
  }
  return errors
}

export type DemandInteractionDrawerProps = {
  demandId: string
  demandCode: string
  demandTitle: string
  positioningBody?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DemandInteractionDrawer({
  demandId,
  demandCode,
  demandTitle,
  positioningBody = '',
  open,
  onOpenChange,
}: DemandInteractionDrawerProps) {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [confirmed, setConfirmed] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [dirty, setDirty] = useState(false)
  const saveMode = useRef<SaveMode>('close')
  const focusResultAfterReset = useRef(false)
  const skipDirtyCloseRef = useRef(false)
  const wasOpenRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const formId = useId()

  const resetAll = useCallback(() => {
    setValues(initialValues())
    setErrors({})
    setConfirmed(false)
    setAnnouncement('')
    setDirty(false)
  }, [])

  const { register, isPending, error: mutationError, reset: resetMutation } = useRegisterInteraction(demandId, {
    onSuccess: () => {
      if (saveMode.current === 'repeat') {
        const now = new Date()
        focusResultAfterReset.current = true
        setValues((current) => ({
          ...current,
          occurredDate: toLocalDateValue(now),
          occurredTime: toLocalTimeValue(now),
          result: '',
          type: '',
          participants: '',
          summary: '',
          nextStep: '',
          channel: '',
          recipient: '',
          body: '',
        }))
        setConfirmed(false)
        setErrors({})
        setAnnouncement('Interação registrada. Preencha a próxima.')
        setDirty(false)
        return
      }
      skipDirtyCloseRef.current = true
      setDirty(false)
      onOpenChange(false)
      resetAll()
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

  useEffect(() => {
    if (!focusResultAfterReset.current || values.result) return
    const resultInput = formRef.current?.querySelector<HTMLElement>('[name="result"]')
    resultInput?.parentElement?.querySelector<HTMLElement>('[role="combobox"]')?.focus()
    focusResultAfterReset.current = false
  }, [values.result])

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setAnnouncement('')
    setDirty(true)
    if (mutationError) resetMutation()
  }

  const updateResult = (result: InteractionResult) => {
    const nextRules = interactionResultRules[result].fields
    setValues((current) => ({
      ...current,
      result,
      type: nextRules.type.visible ? current.type : '',
      participants: nextRules.participants.visible ? current.participants : '',
      summary: nextRules.summary.visible ? current.summary : '',
      nextStep: nextRules.nextStep.visible ? current.nextStep : '',
      channel: nextRules.channel.visible ? current.channel : '',
      recipient: nextRules.recipient.visible ? current.recipient : '',
      body: nextRules.body.visible
        ? (result === 'response_sent' ? (current.body.trim() || positioningBody) : current.body)
        : '',
    }))
    setConfirmed(false)
    setErrors((current) => ({
      ...current,
      result: undefined,
      type: undefined,
      participants: undefined,
      summary: undefined,
      nextStep: undefined,
      channel: undefined,
      recipient: undefined,
      body: undefined,
      confirmed: undefined,
    }))
    setAnnouncement('')
    setDirty(true)
    if (mutationError) resetMutation()
  }

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

  const submit = (mode: SaveMode) => {
    const nextErrors = validate(values, confirmed)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = Object.keys(nextErrors)[0]
      const namedField = formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
      const target = firstInvalid === 'result' || firstInvalid === 'type'
        ? namedField?.parentElement?.querySelector<HTMLElement>('[role="combobox"]')
        : namedField
      target?.focus()
      return
    }
    if (!values.result) return
    saveMode.current = mode
    register({
      occurredAt: fromLocalDateTimeValues(values.occurredDate, values.occurredTime),
      type: values.type || null,
      result: values.result,
      participants: values.participants || null,
      summary: values.summary || null,
      nextStep: values.nextStep || null,
      channel: values.channel || null,
      recipient: values.recipient || null,
      body: values.body || null,
    })
  }

  const canRepeat = !closesCase(values.result)

  return (
    <>
      <DrawerShell
        open={open}
        onOpenChange={(nextOpen) => nextOpen ? onOpenChange(true) : requestClose()}
        title="Registrar interação"
        description={`${demandCode} · ${demandTitle}. Documente o que já aconteceu fora da Sala. Resposta enviada e encerramento sem resposta fecham o caso.`}
        size="lg"
        presentation="layer"
        origin="end"
        closeLabel="Fechar registro de interação"
        footer={(
          <div className={styles.footerActions}>
            <Button className={styles.footerAction} type="button" variant="ghost" onClick={requestClose}>Cancelar</Button>
            {canRepeat ? (
              <Button className={styles.footerAction} type="button" variant="outline" disabled={isPending} onClick={() => submit('repeat')}>Salvar e registrar outra</Button>
            ) : null}
            <Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>Salvar</Button>
          </div>
        )}
      >
        <form ref={formRef} id={formId} className={styles.body} onSubmit={(event) => { event.preventDefault(); submit('close') }}>
        <Card variant="soft" padding="sm" className={styles.origin} role="note" aria-label="Origem da interação">
          <span className={styles.originCopy}>
            <Text as="strong" variant="labelMd">Origem do registro</Text>
            <Text as="small" variant="labelSm" tone="muted">Este contato aconteceu fora da Sala.</Text>
          </span>
          <Badge tone="neutral" size="sm">Fora da plataforma</Badge>
        </Card>
        <SelectField label="Resultado da interação" name="result" required contained placeholder="Selecione o resultado" options={resultOptions} value={values.result} error={errors.result} onValueChange={(value) => updateResult(value as InteractionResult)} />
        <div className={styles.dateTimeGroup} role="group" aria-label="Data e hora">
          <div className={styles.dateTimeGrid}>
            <DatePicker label="Data" name="occurredDate" required hideHint value={values.occurredDate} error={errors.occurredDate} onValueChange={(value) => update('occurredDate', value)} />
            <TimeInput label="Hora" name="occurredTime" required value={values.occurredTime} error={errors.occurredTime} onValueChange={(value) => update('occurredTime', value)} />
          </div>
        </div>
        {values.result ? (() => {
          const fields = interactionResultRules[values.result].fields
          return <>
            {fields.type.visible ? <SelectField label={fields.type.label} name="type" required={fields.type.required} contained placeholder="Selecione o tipo" options={typeOptions} value={values.type} error={errors.type} onValueChange={(value) => update('type', value as InteractionType)} /> : null}
            {fields.channel.visible ? <TextInput aria-label={fields.channel.label} label={fields.channel.label} name="channel" required={fields.channel.required} value={values.channel} error={errors.channel} onChange={(event) => update('channel', event.target.value)} /> : null}
            {fields.recipient.visible ? <TextInput aria-label={fields.recipient.label} label={fields.recipient.label} name="recipient" required={fields.recipient.required} value={values.recipient} error={errors.recipient} onChange={(event) => update('recipient', event.target.value)} /> : null}
            {fields.participants.visible ? <TextInput aria-label={fields.participants.label} label={fields.participants.label} name="participants" required={fields.participants.required} value={values.participants} error={errors.participants} onChange={(event) => update('participants', event.target.value)} /> : null}
            {fields.summary.visible ? <Textarea aria-label={fields.summary.label} label={fields.summary.label} name="summary" required={fields.summary.required} rows={fields.summary.required ? 5 : 3} value={values.summary} error={errors.summary} onChange={(event) => update('summary', event.target.value)} /> : null}
            {fields.body.visible ? <Textarea aria-label={fields.body.label} label={fields.body.label} name="body" required={fields.body.required} rows={5} value={values.body} error={errors.body} onChange={(event) => update('body', event.target.value)} /> : null}
            {fields.nextStep.visible ? <Textarea aria-label={fields.nextStep.label} label={fields.nextStep.label} name="nextStep" required={fields.nextStep.required} rows={3} value={values.nextStep} error={errors.nextStep} onChange={(event) => update('nextStep', event.target.value)} /> : null}
            {values.result === 'closed_without_send' ? (
              <Checkbox
                name="confirmClosure"
                checked={confirmed}
                onCheckedChange={(next) => {
                  setConfirmed(next)
                  setErrors((current) => ({ ...current, confirmed: undefined }))
                  setDirty(true)
                }}
                label="Confirmo o encerramento sem resposta enviada"
              />
            ) : null}
            {errors.confirmed ? <Text as="p" variant="labelSm" tone="error" role="alert">{errors.confirmed}</Text> : null}
          </>
        })() : null}
        {mutationError ? <Text as="p" variant="labelSm" tone="error" className={styles.submitError} role="alert">{mutationError.message}</Text> : null}
        <p className={styles.srOnly} aria-live="polite">{announcement}</p>
        </form>
      </DrawerShell>
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Descartar interação?"
        description="As informações ainda não salvas serão perdidas."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        destructive
        onConfirm={closeNow}
      />
    </>
  )
}
