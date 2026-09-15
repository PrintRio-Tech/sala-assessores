import type { ReactNode } from 'react'
import { Text } from '@print/ui'

import styles from '../styles.module.scss'

export function StackedField({ label, testId, children }: { label: string; testId: string; children: ReactNode }) {
  return (
    <div className={styles.stackedField} data-testid={testId}>
      <Text as="p" variant="labelSm" tone="muted">{label}</Text>
      <div>{children}</div>
    </div>
  )
}
