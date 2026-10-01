import { AuthHeadlineEmphasis, type AuthHeroPillar } from '@print/ui'

import { withAssetBase } from '@/shared/with-asset-base'

export const salaAuthProductName = 'Sala de Assessores'
export const salaAuthEyebrow = 'Assessoria de imprensa'

export const salaAuthHeadline = (
  <>
    Sua <AuthHeadlineEmphasis>narrativa</AuthHeadlineEmphasis> organizada.
  </>
)

export const salaAuthLead = {
  login:
    'Centralize demandas, jornalistas, posicionamentos e relatórios em uma única plataforma',
  verify:
    'Quase lá! Confirme o código enviado para seu e-mail e acesse sua sala de imprensa',
} as const

export const salaAuthPillars: readonly AuthHeroPillar[] = [
  { id: 'demands', label: 'Demandas', description: 'Gerencie pedidos da imprensa' },
  { id: 'journalists', label: 'Jornalistas', description: 'Mapeie e avalie relacionamentos' },
  { id: 'positionings', label: 'Posicionamentos', description: 'Organize respostas estratégicas' },
  { id: 'reports', label: 'Relatórios', description: 'Acompanhe métricas e resultados' },
]

export const salaAuthFooterNote = (
  <>
    <span translate="no">{salaAuthProductName}</span> · Powered by Print
  </>
)

export const salaAuthHeroBrand = (
  <img
    src={withAssetBase('/logos/wordmark-light-tagline.png')}
    alt="Print — Consultoria Estratégica em Comunicação"
    width={200}
    height={55}
    loading="eager"
    decoding="async"
    translate="no"
  />
)

export const salaAuthMobileBrand = (
  <img
    src={withAssetBase('/logos/wordmark-chumbo.png')}
    alt="Print"
    width={120}
    height={32}
    loading="eager"
    decoding="async"
    translate="no"
  />
)
