import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Heading, Text, TextInput } from '@print/ui'

import { useLogin } from '@/application/modules/Auth/hooks/use-login'
import { ROUTES } from '@/ui/routes/paths'
import styles from './styles.module.scss'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const { login, isPending } = useLogin({
    onSuccess: (nextEmail) => {
      navigate(`${ROUTES.verify}?email=${encodeURIComponent(nextEmail)}`)
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!email) {
      setError('Por favor, informe seu e-mail')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor, informe um e-mail válido')
      return
    }

    login(email)
  }

  return (
    <div className={styles.loginCard}>
      <div className={styles.cardHeader}>
        <svg className={styles.printLogo} viewBox="0 0 120 24" fill="currentColor">
          <path d="M0 0h9.6c5.28 0 8.64 2.88 8.64 7.68 0 4.8-3.36 7.68-8.64 7.68H4.32V24H0V0zm9.12 12c2.88 0 4.56-1.44 4.56-4.32S12 3.36 9.12 3.36H4.32V12h4.8zm20.64-12h8.64c4.32 0 7.2 2.16 7.2 6.24 0 2.88-1.44 4.8-3.84 5.76L46.08 24h-4.8l-4.32-11.52h-2.88V24h-4.32V0zm8.16 9.6c2.16 0 3.36-1.2 3.36-3.12s-1.2-3.12-3.36-3.12h-3.84v6.24h3.84zM50.4 0h4.32v24H50.4V0zm14.4 0h4.56l10.56 15.36V0h4.08v24h-4.32L69.12 8.4V24H65.04V0zm29.76 0h4.32v20.64h10.08V24H79.2V0z"/>
        </svg>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.header}>
          <Text as="span" variant="labelSm" className={styles.kicker}>
            ACESSO SEGURO
          </Text>
          <Heading level={1} variant="lg" className={styles.title}>
            Entre com seu e-mail
          </Heading>
          <Text as="p" variant="bodyMd" className={styles.description}>
            Código de uso único por e-mail — sem senha.
          </Text>
        </div>

        <form noValidate onSubmit={handleSubmit} className={styles.form}>
          <TextInput
            label="E-mail corporativo"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nome@empresa.com.br…"
            disabled={isPending}
            error={error}
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isPending}
            className={styles.submitButton}
          >
            {isPending ? 'Enviando código...' : 'Enviar Código'}
          </Button>
        </form>
      </div>
    </div>
  )
}
