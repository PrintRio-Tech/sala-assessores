import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Heading, Text, OtpInput } from '@print/ui'

import { mockAuthService } from '@/application/services/mock-auth-service'
import styles from './verify-page.module.scss'

export function VerifyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!email) {
      navigate('/login')
    }
  }, [email, navigate])

  const handleVerify = async () => {
    setError('')

    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos')
      return
    }

    setIsVerifying(true)

    setTimeout(() => {
      const isValid = mockAuthService.verifyCode(code)

      if (isValid) {
        mockAuthService.setAuthenticated(true, email)
        navigate('/')
      } else {
        setError('Código inválido. Tente 123456')
        setIsVerifying(false)
        setCode('')
      }
    }, 600)
  }

  const handleResend = () => {
    setCode('')
    setError('')
  }

  const handleChangeEmail = () => {
    navigate('/login')
  }

  return (
    <div className={styles.verifyPage}>
      <div className={styles.header}>
        <Heading level={1} size="lg">Confirme o código</Heading>
        <div className={styles.badge}>
          <Text as="span" variant="labelSm">Enviado para</Text>
          <Text as="strong" variant="labelSm">{email}</Text>
        </div>
      </div>

      <div className={styles.form}>
        <div className={styles.otpWrapper}>
          <OtpInput
            length={6}
            value={code}
            onChange={setCode}
            disabled={isVerifying}
            autoFocus
          />
          {error && (
            <Text as="p" variant="bodySm" className={styles.error}>
              {error}
            </Text>
          )}
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isVerifying || code.length !== 6}
          onClick={handleVerify}
        >
          {isVerifying ? 'Verificando...' : 'Entrar na Plataforma'}
        </Button>

        <div className={styles.actions}>
          <button type="button" className={styles.link} onClick={handleResend}>
            Reenviar código
          </button>
          <span className={styles.separator}>•</span>
          <button type="button" className={styles.link} onClick={handleChangeEmail}>
            Alterar e-mail
          </button>
        </div>
      </div>
    </div>
  )
}
