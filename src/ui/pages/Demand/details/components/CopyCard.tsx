import type { ReactNode } from 'react'
import { Card, Heading } from '@print/ui'

import styles from '../styles.module.scss'

export function CopyCard({ title, testId, children }: { title: string; testId?: string; children: ReactNode }) {
  return (
    <Card variant="surface" padding="lg" className={styles.infoCard} data-testid={testId}>
      <Heading level={2} variant="sm">{title}</Heading>
      {children}
    </Card>
  )
}
