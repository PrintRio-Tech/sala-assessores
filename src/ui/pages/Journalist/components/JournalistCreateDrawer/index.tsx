import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  Button,
  ConfirmDialog,
  DrawerShell,
  FormField,
  SelectField,
  Switch,
  Text,
  TextInput,
} from '@print/ui'

import type { NewJournalistInput } from '@/application/modules/Journalist/hooks/use-create-journalist'
import type { EditableJournalistProfile } from '@/application/modules/Journalist/hooks/use-update-journalist'
import styles from './styles.module.scss'

type FormValues = {
  name: string
  outletName: string
  roleTitle: string
  desk: string
  email: string
  phone: string
  preferredChannel: NewJournalistInput['preferredChannel']
  bestContactWindow: string
  topics: string[]
  isActive: boolean
}

type FormErrors = Partial<Record<'name' | 'outletName' | 'email', string>>

const emptyValues: FormValues = {
  name: '',
  outletName: '',
  roleTitle: '',
  desk: '',
  email: '',
  phone: '',
  preferredChannel: 'email',
  bestContactWindow: '',
  topics: [],
  isActive: true,
}

export type JournalistCreateInitialValue = Partial<Pick<FormValues, 'name' | 'outletName'>>

function createInitialValues(initialValue?: JournalistCreateInitialValue): FormValues {
  return {
    ...emptyValues,
    name: initialValue?.name ?? '',
    outletName: initialValue?.outletName ?? '',
  }
}

function profileToFormValues(profile: EditableJournalistProfile): FormValues {
  return {
    name: profile.name,
    outletName: profile.outletName,
    roleTitle: profile.roleTitle,
    desk: profile.desk,
    email: profile.email,
    phone: profile.phone,
    preferredChannel: profile.preferredChannel,
    bestContactWindow: profile.bestContactWindow,
    topics: [...profile.topics],
    isActive: profile.isActive,
  }
}

const channelOptions = [
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Telefone' },
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.name.trim()) errors.name = 'Informe o nome completo.'
  if (!values.outletName.trim()) errors.outletName = 'Informe o veículo ou redação.'
  if (!values.email.trim() && !values.phone.trim()) {
    errors.email = 'Informe pelo menos um e-mail ou telefone.'
  } else if (values.email.trim() && !emailPattern.test(values.email.trim())) {
    errors.email = 'Informe um e-mail válido.'
  }
  return errors
}

function normalizeTopic(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

type TopicTagInputProps = {
  topics: string[]
  suggestions: string[]
  onChange: (topics: string[]) => void
}

function TopicTagInput({ topics, suggestions, onChange }: TopicTagInputProps) {
  const inputId = useId()
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const filteredSuggestions = useMemo(() => {
    const query = normalizeTopic(inputValue).toLocaleLowerCase('pt-BR')
    if (!query) return []

    return suggestions
      .map(normalizeTopic)
      .filter(Boolean)
      .filter((suggestion, index, values) => (
        values.findIndex((value) => value.toLocaleLowerCase('pt-BR') === suggestion.toLocaleLowerCase('pt-BR')) === index
        && suggestion.toLocaleLowerCase('pt-BR').includes(query)
        && !topics.some((topic) => topic.toLocaleLowerCase('pt-BR') === suggestion.toLocaleLowerCase('pt-BR'))
      ))
      .slice(0, 6)
  }, [inputValue, suggestions, topics])

  function addTopic(rawTopic: string) {
    const topic = normalizeTopic(rawTopic)
    if (!topic) return
    if (!topics.some((item) => item.toLocaleLowerCase('pt-BR') === topic.toLocaleLowerCase('pt-BR'))) {
      onChange([...topics, topic])
    }
    setInputValue('')
    inputRef.current?.focus()
  }

  function removeTopic(topic: string) {
    onChange(topics.filter((item) => item !== topic))
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      addTopic(inputValue)
    } else if (event.key === 'Backspace' && !inputValue && topics.length > 0) {
      event.preventDefault()
      onChange(topics.slice(0, -1))
    }
  }

  return (
    <FormField label="Temas de cobertura" name="topics" htmlFor={inputId}>
      <div className={styles.topicField} data-topic-input="chips">
        <div
          className={styles.topicControl}
          data-topic-border="container"
          data-topic-focused={isFocused ? 'true' : undefined}
          role="group"
          aria-label="Temas selecionados"
        >
          {topics.map((topic) => (
            <span className={styles.topicChip} key={topic}>
              <Text as="span" variant="labelSm">{topic}</Text>
              <button className={styles.topicRemove} type="button" aria-label={`Remover tema ${topic}`} onClick={() => removeTopic(topic)}>×</button>
            </span>
          ))}
          <input
            ref={inputRef}
            id={inputId}
            name="topicEntry"
            className={styles.topicInput}
            data-topic-border="none"
            value={inputValue}
            placeholder={topics.length === 0 ? 'Digite e pressione Enter' : 'Adicionar tema'}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={filteredSuggestions.length > 0}
            onChange={(event) => setInputValue(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
          />
        </div>
        {filteredSuggestions.length > 0 ? (
          <div id={listboxId} className={styles.topicSuggestions} role="listbox" aria-label="Sugestões de temas">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                className={styles.topicSuggestion}
                type="button"
                role="option"
                aria-selected="false"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addTopic(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </FormField>
  )
}

export type JournalistCreateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: NewJournalistInput) => void
  topicSuggestions?: string[]
  isPending?: boolean
  error?: Error | null
  mode?: 'create' | 'edit'
  initialValue?: JournalistCreateInitialValue
  initialProfile?: EditableJournalistProfile
  onSave?: (input: EditableJournalistProfile) => void
}

export function JournalistCreateDrawer({
  open,
  onOpenChange,
  onCreate,
  topicSuggestions = [],
  isPending = false,
  error,
  mode = 'create',
  initialValue,
  initialProfile,
  onSave,
}: JournalistCreateDrawerProps) {
  const formId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const initialName = initialValue?.name
  const initialOutletName = initialValue?.outletName
  const [values, setValues] = useState<FormValues>(() => createInitialValues(initialValue))
  const [errors, setErrors] = useState<FormErrors>({})
  const [discardOpen, setDiscardOpen] = useState(false)

  const reset = useCallback(() => {
    setValues(mode === 'edit' && initialProfile
      ? profileToFormValues(initialProfile)
      : createInitialValues({ name: initialName, outletName: initialOutletName }))
    setErrors({})
    setDiscardOpen(false)
  }, [initialName, initialOutletName, initialProfile, mode])

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  function update<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      ...(key === 'phone' ? { email: undefined } : {}),
    }))
  }

  const baseline = mode === 'edit' && initialProfile
    ? profileToFormValues(initialProfile)
    : createInitialValues({ name: initialName, outletName: initialOutletName })
  const hasUnsavedChanges = values.topics.join('\u0000') !== baseline.topics.join('\u0000')
    || Object.entries(values).some(([key, value]) => key !== 'topics' && value !== baseline[key as keyof FormValues])

  function closeNow() {
    reset()
    onOpenChange(false)
  }

  function requestClose() {
    if (hasUnsavedChanges) {
      setDiscardOpen(true)
      return
    }
    closeNow()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    const firstError = (['name', 'outletName', 'email'] as const).find((key) => nextErrors[key])
    if (firstError) {
      window.setTimeout(() => {
        const field = formRef.current?.elements.namedItem(firstError)
        if (field instanceof HTMLElement) field.focus()
      }, 0)
      return
    }

    const profile = {
      name: values.name.trim(),
      outletName: values.outletName.trim(),
      roleTitle: values.roleTitle.trim(),
      desk: values.desk.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      preferredChannel: values.preferredChannel,
      bestContactWindow: values.bestContactWindow.trim(),
      topics: values.topics,
      isActive: values.isActive,
    }
    if (mode === 'edit') {
      onSave?.(profile)
      return
    }
    onCreate(profile)
  }

  return (
    <>
      <DrawerShell
        open={open}
        onOpenChange={(nextOpen) => nextOpen ? onOpenChange(true) : requestClose()}
        title={mode === 'edit' ? 'Editar perfil' : 'Novo jornalista'}
        description={mode === 'edit' ? 'Atualize somente os dados objetivos do cadastro.' : 'O cadastro ficará disponível nesta sessão da Sala.'}
        size="lg"
        contentLayout="scroll"
        presentation="layer"
        origin="end"
        responsiveOrigin="bottom"
        closeLabel={mode === 'edit' ? 'Fechar edição' : 'Fechar cadastro'}
        footer={(
          <div className={styles.footerActions}>
            <Button className={styles.footerAction} type="button" variant="ghost" disabled={isPending} onClick={requestClose}>Cancelar</Button>
            <Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>
              {isPending ? (mode === 'edit' ? 'Salvando…' : 'Cadastrando…') : (mode === 'edit' ? 'Salvar alterações' : 'Cadastrar jornalista')}
            </Button>
          </div>
        )}
      >
        <form ref={formRef} id={formId} className={styles.form} aria-label={mode === 'edit' ? 'Edição de perfil' : 'Cadastro de jornalista'} noValidate onSubmit={submit}>
          <fieldset className={styles.section}>
            <legend>Dados profissionais</legend>
            <div className={styles.grid}>
              <TextInput autoFocus label="Nome completo" name="name" required value={values.name} error={errors.name} onChange={(event) => update('name', event.target.value)} />
              <TextInput label="Veículo ou redação" name="outletName" required value={values.outletName} error={errors.outletName} onChange={(event) => update('outletName', event.target.value)} />
              <TextInput label="Cargo" name="roleTitle" value={values.roleTitle} onChange={(event) => update('roleTitle', event.target.value)} />
              <TextInput label="Editoria" name="desk" value={values.desk} onChange={(event) => update('desk', event.target.value)} />
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend>Contato</legend>
            <Text as="p" variant="labelSm" tone="muted" className={styles.sectionHint}>Um destes contatos é necessário.</Text>
            <div className={styles.grid}>
              <TextInput label="E-mail" name="email" type="email" autoComplete="email" value={values.email} error={errors.email} onChange={(event) => update('email', event.target.value)} />
              <TextInput label="Telefone" name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} />
              <SelectField label="Canal preferencial" name="preferredChannel" contained value={values.preferredChannel} options={channelOptions} onValueChange={(value) => update('preferredChannel', value as FormValues['preferredChannel'])} />
              <TextInput label="Melhor horário para contato" name="bestContactWindow" value={values.bestContactWindow} onChange={(event) => update('bestContactWindow', event.target.value)} />
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend>Cobertura</legend>
            <TopicTagInput topics={values.topics} suggestions={topicSuggestions} onChange={(topics) => update('topics', topics)} />
          </fieldset>

          <fieldset className={styles.section}>
            <legend>Status</legend>
            <Switch name="isActive" checked={values.isActive} onCheckedChange={(checked) => update('isActive', checked)} label="Jornalista ativo" />
          </fieldset>

          {error ? <Text as="p" variant="labelSm" tone="error" role="alert" className={styles.submitError}>{error.message}</Text> : null}
        </form>
      </DrawerShell>
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={mode === 'edit' ? 'Descartar alterações?' : 'Descartar cadastro?'}
        description="As informações preenchidas serão perdidas."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        destructive
        onConfirm={closeNow}
      />
    </>
  )
}
