import { Heading, Text } from '@print/ui'

import styles from './styles.module.scss'

export function ReleasesHero() {
  return (
    <header className={styles.hero}>
      <div className={styles.eyebrow}>
        <span className={styles.dot} aria-hidden="true" />
        <Text as="span" variant="labelMd" className={styles.eyebrowText}>
          Releases
        </Text>
      </div>
      <Heading level={1} variant="xl" className={styles.title}>
        Banco de <span className={styles.emphasis}>releases</span>
      </Heading>
      <Text as="p" variant="bodyMd" tone="muted" className={styles.description}>
        Busque, filtre e abra releases prontos para distribuição.
      </Text>
    </header>
  )
}
