import { ReleaseListCardActions } from '../ReleaseListCardActions'

import styles from './styles.module.scss'

type ReleaseDetailActionsProps = {
  canManage?: boolean
  onEdit: () => void
  onDelete: () => void
}

export function ReleaseDetailActions(props: ReleaseDetailActionsProps) {
  return (
    <ReleaseListCardActions
      className={styles.root}
      canManage={props.canManage}
      onEdit={props.onEdit}
      onDelete={props.onDelete}
    />
  )
}
