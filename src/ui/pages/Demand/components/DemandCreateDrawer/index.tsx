import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  ConfirmDialog,
  DatePicker,
  DrawerSteps,
  PersonDetailedCell,
  SearchableSelectField,
  SelectField,
  TextInput,
  Textarea,
} from '@print/ui'
import type { DemandPriority } from '@/application/modules/Demand/stores/local-demand.store'
import type { Journalist } from '@/application/modules/Journalist/hooks/use-journalists'
import type { NewLocalDemandCapture } from '@/application/modules/Demand/stores/local-demand.store'
import { TagInput } from '@/ui/components/TagInput/TagInput'

import styles from './styles.module.scss'

type ContactMode = 'known' | 'local'

type FormValues = {
  contactMode: ContactMode
  contactName: string
  contactOutlet: string
  subject: string
  factContext: string
  pressRequest: string
  requestedDeadline: string
  channel: string
  journalistId: string
  tags: string[]
  topic: string
  area: string
  priority: DemandPriority | ''
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  contactMode: 'known',
  contactName: '',
  contactOutlet: '',
  subject: '',
  factContext: '',
  pressRequest: '',
  requestedDeadline: '',
  channel: '',
  journalistId: '',
  tags: [],
  topic: '',
  area: '',
  priority: '',
}

const channelOptions = [
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Outro canal' },
]

const priorityOptions: Array<{ value: DemandPriority; label: string }> = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
]

function fieldError(key: keyof FormValues, values: FormValues) {
  if (key === 'channel' && !values.channel) return 'Informe o canal de entrada.'
  if (key === 'journalistId' && values.contactMode === 'known' && !values.journalistId) return 'Informe o contato ou registre-o localmente.'
  if (key === 'contactName' && values.contactMode === 'local' && !values.contactName.trim()) return 'Informe o nome do contato.'
  if (key === 'contactOutlet' && values.contactMode === 'local' && !values.contactOutlet.trim()) return 'Informe a redação ou veículo.'
  if (key === 'subject' && !values.subject.trim()) return 'Informe o assunto do caso.'
  if (key === 'factContext' && !values.factContext.trim()) return 'Descreva o que aconteceu.'
  if (key === 'pressRequest' && !values.pressRequest.trim()) return 'Registre o que foi pedido pela imprensa.'
  if (key === 'requestedDeadline' && !values.requestedDeadline) return 'Informe o prazo solicitado.'
  return undefined
}

const stepFields: Array<Array<keyof FormValues>> = [
  ['channel', 'journalistId', 'contactName', 'contactOutlet'],
  ['subject', 'factContext', 'pressRequest', 'requestedDeadline'],
  [],
]

export type DemandCreateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCapture: (capture: NewLocalDemandCapture) => void
  journalists: Journalist[]
  journalistsLoading?: boolean
  initialJournalistId?: string
  mode?: 'create' | 'edit'
  intent?: 'create' | 'edit'
  initialCapture?: NewLocalDemandCapture
  tagSuggestions?: string[]
  tagsLoading?: boolean
}

function captureToFormValues(capture: NewLocalDemandCapture): FormValues {
  const channel = channelOptions.find((option) => (
    option.value === capture.channel
    || option.label.toLocaleLowerCase('pt-BR') === capture.channel.toLocaleLowerCase('pt-BR')
  ))
  return {
    contactMode: capture.contactMode,
    contactName: capture.contactName,
    contactOutlet: capture.contactOutlet,
    subject: capture.subject,
    factContext: capture.factContext,
    pressRequest: capture.pressRequest,
    requestedDeadline: capture.requestedDeadline,
    channel: channel?.value ?? (capture.channel ? 'other' : ''),
    journalistId: capture.journalistId,
    tags: capture.enrichment?.tags ?? [],
    topic: capture.enrichment?.topics[0] ?? '',
    area: capture.enrichment?.relatedAreas[0] ?? '',
    priority: capture.priority ?? '',
  }
}

export function DemandCreateDrawer({
  open,
  onOpenChange,
  onCapture,
  journalists,
  journalistsLoading = false,
  initialJournalistId,
  mode = 'create',
  intent,
  initialCapture,
  tagSuggestions = [],
  tagsLoading = false,
}: DemandCreateDrawerProps) {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [baseline, setBaseline] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false)
  const [journalistQuery, setJournalistQuery] = useState('')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const skipDirtyCloseRef = useRef(false)
  const wasOpenRef = useRef(false)
  const sessionModeRef = useRef(mode)
  const sessionIntentRef = useRef(intent ?? mode)
  if (open) {
    sessionModeRef.current = mode
    sessionIntentRef.current = intent ?? mode
  }
  const sessionMode = open ? mode : sessionModeRef.current
  const sessionIntent = open ? (intent ?? mode) : sessionIntentRef.current

  const resetFlow = useCallback(() => {
    const nextValues = mode === 'edit' && initialCapture
      ? captureToFormValues(initialCapture)
      : initialJournalistId ? { ...initialValues, journalistId: initialJournalistId } : initialValues
    setValues(nextValues)
    setBaseline(nextValues)
    setErrors({})
    setJournalistQuery('')
    setCurrentStepIndex(0)
  }, [initialCapture, initialJournalistId, mode])

  useEffect(() => {
    if (open && !wasOpenRef.current) resetFlow()
    wasOpenRef.current = open
  }, [open, resetFlow])

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const validateStep = useCallback((index: number) => {
    const nextErrors = Object.fromEntries(
      stepFields[index].map((key) => [key, fieldError(key, values)]).filter(([, error]) => error),
    ) as FormErrors
    setErrors((current) => ({ ...current, ...nextErrors }))
    return Object.keys(nextErrors).length === 0
  }, [values])

  const isStepValid = useCallback((index: number) => stepFields[index].every((key) => !fieldError(key, values)), [values])

  const hasUnsavedChanges = sessionMode === 'edit'
    ? JSON.stringify(values) !== JSON.stringify(baseline)
    : values.contactMode === 'local'
      || values.tags.length > 0
      || Object.entries(values).some(([key, value]) => key !== 'contactMode' && key !== 'tags' && typeof value === 'string' && value.trim().length > 0)
  const selectedJournalist = journalists.find((journalist) => journalist.id === values.journalistId)
  const journalistOptions = useMemo(() => {
    const query = journalistQuery.trim().toLocaleLowerCase('pt-BR')
    const filtered = query
      ? journalists.filter((journalist) => [journalist.name, journalist.outletName, journalist.desk]
        .some((value) => value.toLocaleLowerCase('pt-BR').includes(query)))
      : journalists
    return filtered.map((journalist) => ({ value: journalist.id, label: journalist.name }))
  }, [journalistQuery, journalists])
  const canAddNewContact = values.contactMode === 'known' && journalistQuery.trim().length > 0 && journalistOptions.length === 0

  const beginNewContact = useCallback(() => {
    const contactName = journalistQuery.trim()
    if (!contactName) return
    setValues((current) => ({ ...current, contactMode: 'local', contactName, contactOutlet: '', journalistId: '' }))
    setJournalistQuery('')
    setErrors((current) => ({ ...current, journalistId: undefined, contactName: undefined, contactOutlet: undefined }))
  }, [journalistQuery])

  const closeNow = () => {
    skipDirtyCloseRef.current = false
    setConfirmDiscardOpen(false)
    onOpenChange(false)
  }

  const handleRequestClose = () => {
    if (skipDirtyCloseRef.current) {
      closeNow()
      return
    }
    if (hasUnsavedChanges) {
      setConfirmDiscardOpen(true)
      return
    }
    closeNow()
  }

  const complete = () => {
    if (!validateStep(0) || !validateStep(1)) return
    const contactName = values.contactMode === 'local' ? values.contactName.trim() : selectedJournalist?.name ?? ''
    const contactOutlet = values.contactMode === 'local' ? values.contactOutlet.trim() : selectedJournalist?.outletName ?? ''
    skipDirtyCloseRef.current = true
    onCapture({
      contactMode: values.contactMode,
      contactName,
      contactOutlet,
      subject: values.subject.trim(),
      factContext: values.factContext.trim(),
      pressRequest: values.pressRequest.trim(),
      requestedDeadline: values.requestedDeadline,
      channel: channelOptions.find((option) => option.value === values.channel)?.label ?? values.channel,
      journalistId: values.contactMode === 'known' ? values.journalistId : '',
      journalistName: contactName,
      outletName: contactOutlet,
      priority: values.priority || null,
      enrichment: {
        tags: values.tags,
        topics: values.topic.trim() ? [values.topic.trim()] : [],
        relatedAreas: values.area.trim() ? [values.area.trim()] : [],
        confirmedFacts: initialCapture?.enrichment?.confirmedFacts ?? [],
        pendingFacts: initialCapture?.enrichment?.pendingFacts ?? [],
        nextStep: initialCapture?.enrichment?.nextStep ?? null,
      },
    })
  }

  const steps = useMemo(() => [
    {
      id: 'contact',
      label: 'Contato',
      isValid: isStepValid(0),
      content: (
        <div className={styles.stepContent}>
          {values.contactMode === 'known' ? (
            <SearchableSelectField
              label="Quem entrou em contato?"
              name="journalistId"
              required
              value={values.journalistId}
              options={journalistOptions}
              placeholder="Buscar contato ou redação"
              emptyMessage="Nenhum contato encontrado."
              loading={journalistsLoading}
              selectedLabel={selectedJournalist?.name}
              error={errors.journalistId}
              onValueChange={(value) => update('journalistId', value)}
              onQueryChange={setJournalistQuery}
              footerSlot={canAddNewContact ? (
                <Button type="button" variant="ghost" onClick={beginNewContact}>
                  Adicionar {journalistQuery.trim()} como novo contato
                </Button>
              ) : undefined}
            />
          ) : (
            <div className={styles.contactGrid}>
              <TextInput autoFocus label="Quem entrou em contato?" name="contactName" required value={values.contactName} error={errors.contactName} onChange={(event) => update('contactName', event.target.value)} />
              <TextInput label="Redação ou veículo" name="contactOutlet" required value={values.contactOutlet} error={errors.contactOutlet} onChange={(event) => update('contactOutlet', event.target.value)} />
            </div>
          )}
          <SelectField label="Canal de entrada" name="channel" required value={values.channel} error={errors.channel} options={channelOptions} onValueChange={(value) => update('channel', value)} />
          <SelectField label="Prioridade" name="priority" placeholder="Não informar" options={priorityOptions} value={values.priority} onValueChange={(value) => update('priority', value as DemandPriority)} />
          {(selectedJournalist || (values.contactMode === 'local' && values.contactName.trim())) && (
            <div className={styles.journalistContext} role="region" aria-label="Contexto do contato">
              {selectedJournalist ? (
                <PersonDetailedCell
                  name={selectedJournalist.name}
                  subtitle={[selectedJournalist.outletName, selectedJournalist.desk].filter(Boolean).join(' · ') || undefined}
                  email={selectedJournalist.email || undefined}
                  phone={selectedJournalist.phone || undefined}
                />
              ) : (
                <PersonDetailedCell
                  name={values.contactName}
                  subtitle={values.contactOutlet.trim() || undefined}
                />
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'request',
      label: 'Pedido',
      isValid: isStepValid(1),
      content: (
        <div className={styles.stepContent}>
          <TextInput autoFocus label="Assunto" name="subject" required value={values.subject} error={errors.subject} onChange={(event) => update('subject', event.target.value)} />
          <Textarea label="O que aconteceu?" name="factContext" required rows={5} value={values.factContext} error={errors.factContext} description="Registre o fato recebido." onChange={(event) => update('factContext', event.target.value)} />
          <Textarea label="O que foi pedido pela imprensa?" name="pressRequest" required rows={5} value={values.pressRequest} error={errors.pressRequest} onChange={(event) => update('pressRequest', event.target.value)} />
          <DatePicker label="Prazo solicitado" name="requestedDeadline" required value={values.requestedDeadline} error={errors.requestedDeadline} onValueChange={(value) => update('requestedDeadline', value)} />
        </div>
      ),
    },
    {
      id: 'classification',
      label: 'Classificação',
      isValid: true,
      content: (
        <div className={styles.stepContent}>
          <TagInput tags={values.tags} onChange={(tags) => update('tags', tags)} suggestions={tagSuggestions} loading={tagsLoading} />
          <div className={styles.grid}>
            <TextInput label="Tema" name="topic" value={values.topic} onChange={(event) => update('topic', event.target.value)} />
            <TextInput label="Áreas ou entidades" name="area" value={values.area} onChange={(event) => update('area', event.target.value)} />
          </div>
        </div>
      ),
    },
  ], [beginNewContact, canAddNewContact, errors, isStepValid, journalistOptions, journalistsLoading, journalistQuery, selectedJournalist, tagSuggestions, tagsLoading, values])

  return (
    <>
      <DrawerSteps
        open={open}
        onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : handleRequestClose())}
        onRequestClose={handleRequestClose}
        flowTitle={sessionIntent === 'edit' ? 'Editar demanda' : 'Nova demanda'}
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepChange={setCurrentStepIndex}
        onComplete={complete}
        completeLabel={sessionIntent === 'edit' ? 'Salvar alterações' : 'Concluir captura'}
        advanceLabel="Continuar"
        backLabel="Voltar"
        closeLabel="Cancelar"
        size="lg"
        orientation="horizontal"
        presentation="layer"
        origin="end"
      />
      <ConfirmDialog
        open={confirmDiscardOpen}
        onOpenChange={setConfirmDiscardOpen}
        title={sessionMode === 'edit' ? 'Descartar alterações?' : 'Descartar captura?'}
        description={sessionMode === 'edit' ? 'As alterações desta demanda não serão salvas.' : 'As informações preenchidas nesta entrada serão perdidas.'}
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        destructive
        onConfirm={closeNow}
      />
    </>
  )
}
