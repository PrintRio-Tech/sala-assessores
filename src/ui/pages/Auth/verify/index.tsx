import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AuthEmailBadge,
  AuthForm,
  AuthFormActions,
  AuthFormHeader,
  AuthInlineStatus,
  AuthLayout,
  Button,
  OtpInput,
} from '@print/ui'

import { useVerifyCode } from '@/application/modules/Auth/hooks/use-verify-code'
import { ROUTES } from '@/ui/routes/paths'
import {
  salaAuthEyebrow,
  salaAuthFooterNote,
  salaAuthHeadline,
  salaAuthLead,
  salaAuthMobileBrand,
  salaAuthPillars,
  salaAuthProductName,
} from '../auth-shell'

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

  const handleVerify = (event: FormEvent) => {
    event.preventDefault()
    if (code.length !== 6) return
    verify({ code, email })
  }

  return (
    <AuthLayout
      step={2}
      productName={salaAuthProductName}
      eyebrow={salaAuthEyebrow}
      headline={salaAuthHeadline}
      lead={salaAuthLead.verify}
      pillars={salaAuthPillars}
      footerNote={salaAuthFooterNote}
      mobileBrand={salaAuthMobileBrand}
    >
      <AuthFormHeader
        titleId="verify-form-title"
        title="Confirme o código"
        description="Informe o código de 6 dígitos."
      />
      <AuthEmailBadge>{email}</AuthEmailBadge>
      <AuthForm aria-labelledby="verify-form-title" onSubmit={handleVerify}>
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
          <AuthInlineStatus tone="alert">{error.message}</AuthInlineStatus>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isPending || code.length !== 6}
        >
          {isPending ? 'Verificando...' : 'Entrar na Plataforma'}
        </Button>
      </AuthForm>
      <AuthFormActions>
        <button type="button" onClick={() => setCode('')}>
          Reenviar código
        </button>
        <button type="button" onClick={() => navigate(ROUTES.login)}>
          Alterar e-mail
        </button>
      </AuthFormActions>
    </AuthLayout>
  )
}
