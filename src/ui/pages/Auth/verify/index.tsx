import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Heading, Text, OtpInput } from '@print/ui'

import { useVerifyCode } from '@/application/modules/Auth/hooks/use-verify-code'
import { ROUTES } from '@/ui/routes/paths'
import styles from './styles.module.scss'

export function VerifyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const [code, setCode] = useState('')
  const { verify, isPending, error } = useVerifyCode({
    onSuccess: () => navigate(ROUTES.home),
    onError: () => setCode(''),
  })

  useEffect(() => {
    if (!email) navigate(ROUTES.login)
  }, [email, navigate])

  const handleVerify = () => {
    if (code.length !== 6) return
    verify({ code, email })
  }

  return (
    <div className={styles.verifyCard}>
      <div className={styles.cardHeader}>
        <svg className={styles.printLogo} viewBox="0 0 120 24" fill="currentColor">
          <path d="M0 0h9.6c5.28 0 8.64 2.88 8.64 7.68 0 4.8-3.36 7.68-8.64 7.68H4.32V24H0V0zm9.12 12c2.88 0 4.56-1.44 4.56-4.32S12 3.36 9.12 3.36H4.32V12h4.8zm20.64-12h8.64c4.32 0 7.2 2.16 7.2 6.24 0 2.88-1.44 4.8-3.84 5.76L46.08 24h-4.8l-4.32-11.52h-2.88V24h-4.32V0zm8.16 9.6c2.16 0 3.36-1.2 3.36-3.12s-1.2-3.12-3.36-3.12h-3.84v6.24h3.84zM50.4 0h4.32v24H50.4V0zm14.4 0h4.56l10.56 15.36V0h4.08v24h-4.32L69.12 8.4V24H65.04V0zm29.76 0h4.32v20.64h10.08V24H79.2V0z"/>
        </svg>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.header}>
          <Heading level={1} variant="lg" className={styles.title}>
            Confirme o código
          </Heading>
          <div className={styles.badge}>
            <Text as="span" variant="labelSm">Enviado para</Text>
            <Text as="strong" variant="labelMd">{email}</Text>
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.otpWrapper}>
            <OtpInput
              label="Código de verificação"
              name="otp"
              length={6}
              value={code}
              onChange={setCode}
              disabled={isPending}
              autoFocus
            />
            {error ? (
              <Text as="p" variant="bodyMd" className={styles.error}>
                {error.message}
              </Text>
            ) : null}
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={isPending || code.length !== 6}
            onClick={handleVerify}
            className={styles.submitButton}
          >
            {isPending ? 'Verificando...' : 'Entrar na Plataforma'}
          </Button>

          <div className={styles.actions}>
            <button type="button" className={styles.link} onClick={() => setCode('')}>
              Reenviar código
            </button>
            <span className={styles.separator}>•</span>
            <button type="button" className={styles.link} onClick={() => navigate(ROUTES.login)}>
              Alterar e-mail
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
