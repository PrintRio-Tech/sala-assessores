import type { ReactNode } from 'react'
import { Text } from '@print/ui'

import styles from './styles.module.scss'

type ReleaseFormSettingsPanelProps = {
  title: string
  children: ReactNode
}

export function ReleaseFormSettingsPanel({ title, children }: ReleaseFormSettingsPanelProps) {
  return (
    <section className={styles.panel} aria-label={title}>
      <header className={styles.header}>
        <Text as="span" variant="labelSm" className={styles.title}>{title}</Text>
      </header>
      <div className={styles.content}>{children}</div>
    </section>
  )
}
