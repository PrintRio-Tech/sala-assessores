import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Chip,
  ConfirmDialog,
  DatePicker,
  DrawerSteps,
  PersonDetailedCell,
  SearchableSelectField,
  SelectField,
  TextInput,
  Textarea,
} from '@print/ui'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { NewLocalDemandCapture } from '@/application/modules/Demand/stores/local-demand.store'

import styles from './demand-create-drawer.module.scss'

type ContactMode = 'known' | 'local' | 'skip'

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
  receivedAt: string
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
  receivedAt: new Date().toISOString().slice(0, 16),
}

const channelOptions = [
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Outro canal' },
]

const suggestedTags = [
  'acidente',
  'operação',
  'segurança',
  'manutenção',
  'ambiental',
  'regulatório',
  'financeiro',
  'RH',
  'comunicado',
  'urgente',
]

function fieldError(key: keyof FormValues, values: FormValues) {
  if (key === 'channel' && !values.channel) return 'Informe o canal de entrada.'
  if (key === 'contactName' && values.contactMode === 'local' && !values.contactName.trim()) return 'Informe o nome do contato.'
  if (key === 'contactOutlet' && values.contactMode === 'local' && !values.contactOutlet.trim()) return 'Informe a redação ou veículo.'
  if (key === 'subject' && !values.subject.trim()) return 'Informe o assunto do caso.'
  if (key === 'factContext' && !values.factContext.trim()) return 'Descreva o que aconteceu.'
  if (key === 'pressRequest' && !values.pressRequest.trim()) return 'Registre o que foi pedido pela imprensa.'
  if (key === 'requestedDeadline' && !values.requestedDeadline) return 'Informe o prazo solicitado.'
  return undefined
}

const stepFields: Array<Array<keyof FormValues>> = [
  ['channel', 'receivedAt', 'journalistId', 'contactName', 'contactOutlet'],
  ['subject', 'factContext'],
  ['pressRequest', 'requestedDeadline', 'tags'],
]

export type DemandCreateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCapture: (capture: NewLocalDemandCapture) => void
  journalists: Journalist[]
  journalistsLoading?: boolean
  initialJournalistId?: string
}

export function DemandCreateDrawer({ open, onOpenChange, onCapture, journalists, journalistsLoading = false, initialJournalistId }: DemandCreateDrawerProps) {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false)
  const [journalistQuery, setJournalistQuery] = useState('')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [tagInput, setTagInput] = useState('')

  const resetFlow = useCallback(() => {
    setValues(initialJournalistId ? { ...initialValues, journalistId: initialJournalistId } : initialValues)
    setErrors({})
    setJournalistQuery('')
    setCurrentStepIndex(0)
    setTagInput('')
  }, [initialJournalistId])

  useEffect(() => {
    if (open) resetFlow()
  }, [open, resetFlow])

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || values.tags.includes(trimmed)) return
    update('tags', [...values.tags, trimmed])
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    update('tags', values.tags.filter((t) => t !== tag))
  }

  const skipContact = useCallback(() => {
    setValues((current) => ({ ...current, contactMode: 'skip', contactName: '', contactOutlet: '', journalistId: '' }))
    setJournalistQuery('')
    setErrors((current) => ({ ...current, journalistId: undefined, contactName: undefined, contactOutlet: undefined }))
  }, [])

  const validateStep = useCallback((index: number) => {
    const nextErrors = Object.fromEntries(
      stepFields[index].map((key) => [key, fieldError(key, values)]).filter(([, error]) => error),
    ) as FormErrors
    setErrors((current) => ({ ...current, ...nextErrors }))
    return Object.keys(nextErrors).length === 0
  }, [values])

  const isStepValid = useCallback((index: number) => stepFields[index].every((key) => !fieldError(key, values)), [values])

  const hasUnsavedChanges = values.contactMode !== 'known'
    || Object.entries(values).some(([key, value]) => {
      if (key === 'contactMode' || key === 'tags') return false
      if (key === 'tags') return Array.isArray(value) && value.length > 0
      return typeof value === 'string' && value.trim().length > 0
    })
    || values.tags.length > 0
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
    setConfirmDiscardOpen(false)
    onOpenChange(false)
    resetFlow()
  }

  const handleRequestClose = () => {
    if (hasUnsavedChanges) {
      setConfirmDiscardOpen(true)
      return
    }
    closeNow()
  }

  const complete = () => {
    if (!validateStep(2)) return
    const contactName = values.contactMode === 'local' ? values.contactName.trim() 
      : values.contactMode === 'known' ? (selectedJournalist?.name ?? '') 
      : 'Sem contato cadastrado'
    const contactOutlet = values.contactMode === 'local' ? values.contactOutlet.trim() 
      : values.contactMode === 'known' ? (selectedJournalist?.outletName ?? '') 
      : ''
    onCapture({
      contactMode: values.contactMode === 'skip' ? 'local' : values.contactMode,
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
      tags: values.tags,
      receivedAt: values.receivedAt ? new Date(values.receivedAt) : undefined,
    })
    resetFlow()
  }

  const steps = useMemo(() => [
    {
      id: 'contact',
      label: 'Contato',
      isValid: isStepValid(0),
      content: (
        <div className={styles.stepContent}>
          <div className={styles.receivedAtRow}>
            <TextInput 
              type="datetime-local" 
              label="Data/hora do recebimento" 
              name="receivedAt" 
              value={values.receivedAt} 
              onChange={(event) => update('receivedAt', event.target.value)}
              description="Momento em que a demanda foi recebida"
            />
          </div>
          <SelectField label="Canal de entrada" name="channel" required value={values.channel} error={errors.channel} options={channelOptions} onValueChange={(value) => update('channel', value)} />
          {values.contactMode === 'known' ? (
            <>
              <SearchableSelectField
                label="Quem entrou em contato?"
                name="journalistId"
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
              <Button type="button" variant="ghost" onClick={skipContact}>
                Receber sem contato cadastrado
              </Button>
            </>
          ) : values.contactMode === 'local' ? (
            <>
              <div className={styles.contactGrid}>
                <TextInput autoFocus label="Quem entrou em contato?" name="contactName" required value={values.contactName} error={errors.contactName} onChange={(event) => update('contactName', event.target.value)} />
                <TextInput label="Redação ou veículo" name="contactOutlet" required value={values.contactOutlet} error={errors.contactOutlet} onChange={(event) => update('contactOutlet', event.target.value)} />
              </div>
              <Button type="button" variant="ghost" onClick={() => update('contactMode', 'known')}>
                Voltar à busca de contato
              </Button>
            </>
          ) : (
            <>
              <Card variant="surface" padding="md">
                <p>Recebimento sem contato cadastrado. Você poderá enriquecer ou converter em jornalista posteriormente.</p>
              </Card>
              <Button type="button" variant="ghost" onClick={() => update('contactMode', 'known')}>
                Buscar contato cadastrado
              </Button>
            </>
          )}
          {(selectedJournalist || (values.contactMode === 'local' && (values.contactName || values.contactOutlet))) && (
            <Card variant="surface" padding="md" className={styles.journalistContext} role="region" aria-label="Contexto do contato">
              {selectedJournalist ? (
                <PersonDetailedCell name={selectedJournalist.name} subtitle={`${selectedJournalist.outletName} · ${selectedJournalist.desk}`} email={selectedJournalist.email} phone={selectedJournalist.phone} />
              ) : (
                <PersonDetailedCell name={values.contactName || 'Nome do contato'} subtitle={values.contactOutlet || 'Redação ou veículo'} />
              )}
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'case',
      label: 'Caso',
      isValid: isStepValid(1),
      content: (
        <div className={styles.stepContent}>
          <TextInput autoFocus label="Assunto" name="subject" required value={values.subject} error={errors.subject} onChange={(event) => update('subject', event.target.value)} />
          <Textarea label="O que aconteceu?" name="factContext" required rows={5} value={values.factContext} error={errors.factContext} description="Registre o fato recebido." onChange={(event) => update('factContext', event.target.value)} />
        </div>
      ),
    },
    {
      id: 'request',
      label: 'Pedido',
      isValid: isStepValid(2),
      content: (
        <div className={styles.stepContent}>
          <Textarea autoFocus label="O que foi pedido pela imprensa?" name="pressRequest" required rows={5} value={values.pressRequest} error={errors.pressRequest} onChange={(event) => update('pressRequest', event.target.value)} />
          <DatePicker label="Prazo solicitado" name="requestedDeadline" required value={values.requestedDeadline} error={errors.requestedDeadline} onValueChange={(value) => update('requestedDeadline', value)} />
          <div>
            <label htmlFor="tags-input">Tags de recuperação</label>
            <div className={styles.tagsContainer}>
              {values.tags.map((tag) => (
                <Chip key={tag} label={tag} onRemove={() => removeTag(tag)} />
              ))}
            </div>
            <TextInput
              id="tags-input"
              name="tags"
              placeholder="Digite uma tag e pressione Enter"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addTag(tagInput)
                }
              }}
            />
            <div className={styles.suggestedTags}>
              <small>Sugestões:</small>
              {suggestedTags
                .filter((tag) => !values.tags.includes(tag))
                .map((tag) => (
                  <Button key={tag} type="button" variant="ghost" size="sm" onClick={() => addTag(tag)}>
                    {tag}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      ),
    },
  ], [beginNewContact, canAddNewContact, errors, isStepValid, journalistOptions, journalistsLoading, journalistQuery, selectedJournalist, skipContact, tagInput, values])

  return (
    <>
      <DrawerSteps
        open={open}
        onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : handleRequestClose())}
        onRequestClose={handleRequestClose}
        flowTitle="Nova demanda"
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepChange={setCurrentStepIndex}
        onComplete={complete}
        completeLabel="Concluir captura"
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
        title="Descartar captura?"
        description="As informações preenchidas nesta entrada serão perdidas."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        destructive
        onConfirm={closeNow}
      />
    </>
  )
}
