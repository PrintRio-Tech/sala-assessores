import { Badge } from '@print/ui'

import type { ReleaseStatus } from '@/application/modules/Release/presentation/release-labels'
import { getReleaseStatusLabel } from '../../constants'

import styles from './styles.module.scss'

type ReleaseStatusBadgeProps = {
  status: ReleaseStatus
  className?: string
}

const statusClass: Record<ReleaseStatus, string> = {
  in_progress: styles.statusInProgress,
  sent: styles.statusFinished,
}

export function ReleaseStatusBadge({ status, className }: ReleaseStatusBadgeProps) {
  return (
    <Badge className={[statusClass[status], className].filter(Boolean).join(' ')}>
      {getReleaseStatusLabel(status)}
    </Badge>
  )
}
