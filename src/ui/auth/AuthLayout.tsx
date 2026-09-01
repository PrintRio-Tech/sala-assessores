import { Outlet } from 'react-router-dom'
import { Text } from '@print/ui'

import styles from './auth-layout.module.scss'

export function AuthLayout() {
  return (
    <div className={styles.authLayout}>
      <aside className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.brandLogo}>
            <span className={styles.brandMark}>S</span>
            <Text as="h1" variant="headingMd">Sala de Assessores</Text>
          </div>
          <Text as="p" variant="bodyLg" className={styles.heroDescription}>
            Sua plataforma completa para gestão de relacionamento com a imprensa
          </Text>
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
