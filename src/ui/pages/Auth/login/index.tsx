import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AuthForm,
  AuthFormHeader,
  AuthLayout,
  Button,
  TextInput,
  useToast,
} from '@print/ui'

import { useLogin } from '@/application/modules/Auth/hooks/use-login'
import { magicLinkAcceptedCopy } from '@/application/modules/Auth/utils/magic-link-request-copy'
import { diagnoseMagicLinkRequestError } from '@/application/modules/Auth/utils/otp-resend-diagnostics'
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

export function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const { login, isPending } = useLogin({
    onSuccess: (nextEmail) => {
      toast.success(
        magicLinkAcceptedCopy.request.title,
        magicLinkAcceptedCopy.request.description,
      )
      navigate(`${ROUTES.verify}?email=${encodeURIComponent(nextEmail)}`)
    },
    onError: (nextError) => {
      if (nextError.name === 'InvalidEmailError') {
        setError(nextError.message)
        return
      }
      const diag = diagnoseMagicLinkRequestError(nextError, 'request')
      toast.error(diag.toast.title, diag.toast.description)
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
    <AuthLayout
      step={1}
      productName={salaAuthProductName}
      eyebrow={salaAuthEyebrow}
      headline={salaAuthHeadline}
      lead={salaAuthLead.login}
      pillars={salaAuthPillars}
      footerNote={salaAuthFooterNote}
      mobileBrand={salaAuthMobileBrand}
    >
      <AuthFormHeader
        titleId="login-form-title"
        title="Entre com seu e-mail"
        description="Código de uso único por e-mail — sem senha."
      />
      <AuthForm aria-labelledby="login-form-title" onSubmit={handleSubmit}>
        <TextInput
          label="E-mail corporativo"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome@empresa.com.br…"
          disabled={isPending}
          error={error}
          required
          autoFocus
        />
        <Button type="submit" variant="primary" size="lg" disabled={isPending}>
          {isPending ? 'Enviando código...' : 'Enviar Código'}
        </Button>
      </AuthForm>
    </AuthLayout>
  )
}
