import { useEffect, useId, useState, type FormEvent } from 'react'
import { Button, DatePicker, DrawerShell, Text, TextInput, Textarea } from '@print/ui'

import styles from './demand-action-drawers.module.scss'

export type DemandVersionInput = { version: string; date: string; body: string }
export type DemandVersionDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: DemandVersionInput) => void
  isPending?: boolean
  error?: Error | null
}

export function DemandVersionDrawer({ open, onOpenChange, onSubmit, isPending = false, error }: DemandVersionDrawerProps) {
  const formId = useId()
  const [version, setVersion] = useState('')
  const [date, setDate] = useState('')
  const [body, setBody] = useState('')
  useEffect(() => {
    if (open) {
      setVersion('')
      setDate('')
      setBody('')
    }
  }, [open])
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit({ version: version.trim(), date, body: body.trim() })
  }
  return (
    <DrawerShell open={open} onOpenChange={onOpenChange} title="Nova versão" description="Registre o artefato revisado antes de solicitar um novo review." size="lg" contentLayout="scroll" presentation="layer" origin="end" responsiveOrigin="bottom" closeLabel="Fechar nova versão" footer={<div className={styles.footerActions}><Button className={styles.footerAction} type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button className={styles.footerAction} form={formId} type="submit" disabled={isPending}>{isPending ? 'Salvando…' : 'Salvar nova versão'}</Button></div>}>
      <form id={formId} className={styles.form} aria-label="Nova versão" onSubmit={submit}>
        <div className={styles.grid}><TextInput autoFocus required label="Identificação da versão" name="version" value={version} onChange={(event) => setVersion(event.target.value)} /><DatePicker required label="Data da versão" name="versionDate" value={date} onValueChange={setDate} /></div>
        <Textarea required label="Conteúdo da nova versão" name="versionBody" rows={10} value={body} onChange={(event) => setBody(event.target.value)} />
        {error ? <Text as="p" variant="labelSm" tone="error" role="alert">{error.message}</Text> : null}
      </form>
    </DrawerShell>
  )
}
