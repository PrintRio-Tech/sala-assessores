import type { MouseEvent } from 'react'
import { Button, ICONS } from '@print/ui'

import { Icon } from '@/ui/components/DsIcon'

import styles from './styles.module.scss'

type ReleaseListCardActionsProps = {
  className?: string
  canManage?: boolean
  onEdit: () => void
  onDelete: () => void
  onClick?: (event: MouseEvent) => void
  onPointerDown?: (event: MouseEvent) => void
}

function stopPropagation(event: MouseEvent) {
  event.stopPropagation()
}

export function ReleaseListCardActions({
  className,
  canManage = true,
  onEdit,
  onDelete,
  onClick,
  onPointerDown,
}: ReleaseListCardActionsProps) {
  const handlePointer = (event: MouseEvent) => {
    stopPropagation(event)
    onPointerDown?.(event)
  }

  const handleClick = (event: MouseEvent) => {
    stopPropagation(event)
    onClick?.(event)
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} onClick={handleClick} onPointerDown={handlePointer}>
      {canManage ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Editar release"
          onClick={(event) => {
            stopPropagation(event)
            onEdit()
          }}
        >
          <Icon src={ICONS.table.edit} size={16} aria-hidden />
        </Button>
      ) : null}

      {canManage ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Excluir release"
          onClick={(event) => {
            stopPropagation(event)
            onDelete()
          }}
        >
          <Icon src={ICONS.table.delete} size={16} aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
