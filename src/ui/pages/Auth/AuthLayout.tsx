import { Outlet, useLocation } from 'react-router-dom'
import { Text } from '@print/ui'

import styles from './auth-layout.module.scss'

export function AuthLayout() {
  const location = useLocation()
  const isVerifyPage = location.pathname.includes('/verificar')

  const leadText = isVerifyPage
    ? 'Quase lá! Confirme o código enviado para seu e-mail e acesse sua sala de imprensa'
    : 'Centralize demandas, jornalistas, posicionamentos e relatórios em uma única plataforma'

  return (
    <div className={styles.authLayout}>
      <aside className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroHeader}>
            <svg className={styles.printLogo} viewBox="0 0 120 24" fill="currentColor">
              <path d="M0 0h9.6c5.28 0 8.64 2.88 8.64 7.68 0 4.8-3.36 7.68-8.64 7.68H4.32V24H0V0zm9.12 12c2.88 0 4.56-1.44 4.56-4.32S12 3.36 9.12 3.36H4.32V12h4.8zm20.64-12h8.64c4.32 0 7.2 2.16 7.2 6.24 0 2.88-1.44 4.8-3.84 5.76L46.08 24h-4.8l-4.32-11.52h-2.88V24h-4.32V0zm8.16 9.6c2.16 0 3.36-1.2 3.36-3.12s-1.2-3.12-3.36-3.12h-3.84v6.24h3.84zM50.4 0h4.32v24H50.4V0zm14.4 0h4.56l10.56 15.36V0h4.08v24h-4.32L69.12 8.4V24H65.04V0zm29.76 0h4.32v20.64h10.08V24H79.2V0z"/>
            </svg>
            <Text as="p" variant="labelSm" className={styles.tagline}>
              CONSULTORIA ESTRATÉGICA EM COMUNICAÇÃO
            </Text>
          </div>

          <div className={styles.heroMain}>
            <Text as="p" variant="labelSm" className={styles.eyebrow}>
              • ASSESSORIA DE IMPRENSA
            </Text>
            <Text as="h1" variant="bodyLg" className={styles.headline}>
              Sua narrativa <span className={styles.highlight}>organizada</span>
            </Text>
            <Text as="p" variant="bodyLg" className={styles.lead}>
              {leadText}
            </Text>
          </div>

          <div className={styles.pillars}>
            <div className={styles.pillar}>
              <Text as="strong" variant="labelMd" className={styles.pillarTitle}>
                Demandas
              </Text>
              <Text as="p" variant="bodyMd" className={styles.pillarDesc}>
                Gerencie pedidos da imprensa
              </Text>
            </div>
            <div className={styles.pillar}>
              <Text as="strong" variant="labelMd" className={styles.pillarTitle}>
                Jornalistas
              </Text>
              <Text as="p" variant="bodyMd" className={styles.pillarDesc}>
                Mapeie e avalie relacionamentos
              </Text>
            </div>
            <div className={styles.pillar}>
              <Text as="strong" variant="labelMd" className={styles.pillarTitle}>
                Posicionamentos
              </Text>
              <Text as="p" variant="bodyMd" className={styles.pillarDesc}>
                Organize respostas estratégicas
              </Text>
            </div>
            <div className={styles.pillar}>
              <Text as="strong" variant="labelMd" className={styles.pillarTitle}>
                Relatórios
              </Text>
              <Text as="p" variant="bodyMd" className={styles.pillarDesc}>
                Acompanhe métricas e resultados
              </Text>
            </div>
          </div>

          <div className={styles.heroFooter}>
            <Text as="p" variant="bodyMd">
              Sala de Assessores · Powered by Print
            </Text>
          </div>
        </div>
      </aside>
      <main className={styles.formArea}>
        <div className={styles.formContainer}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
