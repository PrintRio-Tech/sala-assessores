import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Heading, Text, TextInput } from '@print/ui'

import styles from './login-page.module.scss'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      navigate(`/login/verificar?email=${encodeURIComponent(email)}`)
    }, 800)
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.header}>
        <Text as="span" variant="labelSm" className={styles.kicker}>Acesso seguro</Text>
        <Heading level={1} size="lg">Entre com seu e-mail</Heading>
        <Text as="p" variant="bodyMd" className={styles.description}>
          Enviaremos um código único de 6 dígitos para você acessar a plataforma
        </Text>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <TextInput
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          disabled={isSubmitting}
          error={error}
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando código...' : 'Enviar Código'}
        </Button>
      </form>
    </div>
  )
}
