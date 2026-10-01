import {
  AuthRateLimitedError,
  InvalidEmailError,
  SessionUnavailableError,
} from '@/domain/Auth/errors/auth.errors'

export type OtpResendDiagKind =
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'VALIDATION'
  | 'UNAVAILABLE'
  | 'UNKNOWN'

export type MagicLinkRequestSurface = 'request' | 'resend'

export type OtpResendDiag = {
  kind: OtpResendDiagKind
  toast: { title: string; description: string }
  cooldownSeconds: number
}

function copyFor(
  surface: MagicLinkRequestSurface,
  kind: OtpResendDiagKind,
): { title: string; description: string } {
  if (kind === 'RATE_LIMITED') {
    return {
      title: 'Aguarde um pouco',
      description:
        surface === 'request'
          ? 'Para sua segurança, espere alguns instantes antes de solicitar outro código.'
          : 'Para sua segurança, espere alguns instantes antes de reenviar o código.',
    }
  }

  if (kind === 'NETWORK') {
    return surface === 'request'
      ? {
          title: 'Falha ao enviar',
          description: 'Verifique sua conexão e tente novamente em instantes.',
        }
      : {
          title: 'Falha ao reenviar',
          description: 'Verifique sua conexão e tente novamente em instantes.',
        }
  }

  if (kind === 'UNAVAILABLE') {
    return surface === 'request'
      ? {
          title: 'Não foi possível enviar',
          description:
            'O serviço de acesso está temporariamente indisponível. Tente de novo em instantes.',
        }
      : {
          title: 'Não foi possível reenviar',
          description:
            'O serviço de acesso está temporariamente indisponível. Tente de novo em instantes.',
        }
  }

  return surface === 'request'
    ? {
        title: 'Não foi possível enviar',
        description: 'Tente novamente em alguns instantes.',
      }
    : {
        title: 'Não foi possível reenviar',
        description: 'Tente novamente em alguns instantes.',
      }
}

export function diagnoseMagicLinkRequestError(
  error: unknown,
  surface: MagicLinkRequestSurface = 'resend',
): OtpResendDiag {
  if (error instanceof AuthRateLimitedError) {
    return {
      kind: 'RATE_LIMITED',
      toast: copyFor(surface, 'RATE_LIMITED'),
      cooldownSeconds: 60,
    }
  }

  if (error instanceof InvalidEmailError) {
    return {
      kind: 'VALIDATION',
      toast: copyFor(surface, 'VALIDATION'),
      cooldownSeconds: 20,
    }
  }

  if (error instanceof SessionUnavailableError) {
    return {
      kind: 'UNAVAILABLE',
      toast: copyFor(surface, 'UNAVAILABLE'),
      cooldownSeconds: 10,
    }
  }

  return {
    kind: 'NETWORK',
    toast: copyFor(surface, 'NETWORK'),
    cooldownSeconds: 10,
  }
}

export function diagnoseOtpResendError(error: unknown): OtpResendDiag {
  return diagnoseMagicLinkRequestError(error, 'resend')
}
