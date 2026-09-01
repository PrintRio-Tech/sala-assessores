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
          <div className={styles.header}>
            <div className={styles.brandLogo}>
              <span className={styles.brandMark}>S</span>
              <Text as="div" variant="headingMd" className={styles.brandName}>
                Sala de Assessores
              </Text>
            </div>
            <Text as="p" variant="labelSm" className={styles.tagline}>
              Plataforma Print
            </Text>
          </div>

          <div className={styles.main}>
            <Text as="p" variant="labelSm" className={styles.eyebrow}>
              Assessoria de imprensa
            </Text>
            <Text as="h1" variant="headingXl" className={styles.headline}>
              Fortaleça seu <span className={styles.highlight}>relacionamento</span> com a mídia
            </Text>
            <Text as="p" variant="bodyLg" className={styles.lead}>
              {leadText}
            </Text>
          </div>

          <div className={styles.pillars}>
            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>◆</div>
              <Text as="span" variant="labelSm">Demandas</Text>
            </div>
            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>◆</div>
              <Text as="span" variant="labelSm">Jornalistas</Text>
            </div>
            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>◆</div>
              <Text as="span" variant="labelSm">Posicionamentos</Text>
            </div>
            <div className={styles.pillar}>
              <div className={styles.pillarIcon}>◆</div>
              <Text as="span" variant="labelSm">Relatórios</Text>
            </div>
          </div>

          <div className={styles.footer}>
            <Text as="p" variant="bodySm" className={styles.footerText}>
              Sala de Assessores · Powered by Print
            </Text>
          </div>
        </div>
      </aside>
      <main className={styles.formArea}>
        <div className={styles.formCard}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
