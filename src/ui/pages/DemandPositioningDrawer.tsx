import { useEffect, useId, useState, type FormEvent } from 'react'
import { Button, DatePicker, DrawerShell, SelectField, Text, TextInput, Textarea } from '@print/ui'

import styles from './demand-action-drawers.module.scss'

export type DemandPositioningInput = { version: string; channel: string; recipient: string; date: string; body: string }
export type DemandPositioningDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: DemandPositioningInput) => void
  channelOptions?: Array<{ value: string; label: string }>
  initialValue?: Partial<DemandPositioningInput>
  isPending?: boolean
  error?: Error | null
}

const defaultChannels = [{ value: 'email', label: 'E-mail' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'phone', label: 'Telefone' }, { value: 'other', label: 'Outro canal' }]
const blank: DemandPositioningInput = { version: '', channel: '', recipient: '', date: '', body: '' }

export function DemandPositioningDrawer({ open, onOpenChange, onSubmit, channelOptions = defaultChannels, initialValue, isPending = false, error }: DemandPositioningDrawerProps) {
  const formId = useId()
  const [values, setValues] = useState(() => ({ ...blank, ...initialValue }))
  useEffect(() => { if (open) setValues({ ...blank, ...initialValue }) }, [open, initialValue])
  const update = <K extends keyof DemandPositioningInput>(key: K, value: DemandPositioningInput[K]) => setValues((current) => ({ ...current, [key]: value }))
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ version: values.version.trim(), channel: values.channel, recipient: values.recipient.trim(), date: values.date, body: values.body.trim() }) }

  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} title="Registrar posicionamento" description="Registre a versão final e os dados previstos para envio." size="lg" contentLayout="scroll" presentation="layer" origin="end" responsiveOrigin="bottom" closeLabel="Fechar posicionamento" footer={<div className={styles.footerActions}><Button className={styles.footerAction} type="button" variant="ghost" disabled={isPending} onClick={() => onOpenChange(false)}>Cancelar</Button><Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>{isPending ? 'Registrando…' : 'Registrar posicionamento'}</Button></div>}>
      <form id={formId} className={styles.form} aria-label="Posicionamento final" onSubmit={submit}><div className={styles.grid}><TextInput label="Versão final" name="version" required value={values.version} onChange={(event) => update('version', event.target.value)} /><SelectField label="Canal de envio" name="channel" contained required placeholder="Selecione" options={channelOptions} value={values.channel} onValueChange={(value) => update('channel', value)} /><TextInput label="Destinatário" name="recipient" required value={values.recipient} onChange={(event) => update('recipient', event.target.value)} /><DatePicker label="Data do posicionamento" name="date" required value={values.date} onValueChange={(value) => update('date', value)} /></div><Textarea label="Posicionamento final" name="body" required rows={8} value={values.body} onChange={(event) => update('body', event.target.value)} />{error ? <Text as="p" variant="labelSm" tone="error" role="alert">{error.message}</Text> : null}</form>
    </DrawerShell>
  )
}
