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
  useToast,
} from '@print/ui'

import { useLogin } from '@/application/modules/Auth/hooks/use-login'
import { useVerifyCode } from '@/application/modules/Auth/hooks/use-verify-code'
import {
  MAGIC_LINK_SUCCESS_COOLDOWN_SECONDS,
  magicLinkAcceptedCopy,
} from '@/application/modules/Auth/utils/magic-link-request-copy'
import { diagnoseOtpResendError } from '@/application/modules/Auth/utils/otp-resend-diagnostics'
import { ROUTES } from '@/ui/routes/paths'
import {
  salaAuthEyebrow,
  salaAuthFooterNote,
  salaAuthHeadline,
  salaAuthHeroBrand,
  salaAuthLead,
  salaAuthMobileBrand,
  salaAuthPillars,
  salaAuthProductName,
} from '../auth-shell'

export function VerifyPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const [code, setCode] = useState('')
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState(0)
  const { verify, isPending, error } = useVerifyCode({
    onSuccess: () => navigate(ROUTES.home),
    onError: () => setCode(''),
  })
  const { login: resend, isPending: isResending } = useLogin({
    onSuccess: () => {
      toast.success(
        magicLinkAcceptedCopy.resend.title,
        magicLinkAcceptedCopy.resend.description,
      )
      setCooldownSecondsRemaining(MAGIC_LINK_SUCCESS_COOLDOWN_SECONDS)
    },
    onError: (nextError) => {
      const diag = diagnoseOtpResendError(nextError)
      setCooldownSecondsRemaining(diag.cooldownSeconds)
      toast.error(diag.toast.title, diag.toast.description)
    },
  })

  const cooldownActive = cooldownSecondsRemaining > 0

  useEffect(() => {
    if (!email) navigate(ROUTES.login)
  }, [email, navigate])

  useEffect(() => {
    if (!cooldownActive) return
    const id = window.setInterval(() => {
      setCooldownSecondsRemaining((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [cooldownActive])

  const handleVerify = (event: FormEvent) => {
    event.preventDefault()
    if (code.length !== 6) return
    verify({ code, email })
  }

  const handleResend = () => {
    if (!email) {
      navigate(ROUTES.login)
      return
    }
    if (cooldownActive || isResending) return
    resend(email)
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
      heroBrand={salaAuthHeroBrand}
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
        <button type="button" onClick={handleResend} disabled={cooldownActive || isResending}>
          {isResending ? 'Reenviando...' : 'Reenviar código'}
        </button>
        <button type="button" onClick={() => navigate(ROUTES.login)}>
          Alterar e-mail
        </button>
      </AuthFormActions>
    </AuthLayout>
  )
}
