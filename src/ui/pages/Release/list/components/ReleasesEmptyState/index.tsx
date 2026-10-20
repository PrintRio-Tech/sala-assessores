import { Button, Text } from '@print/ui'

import styles from './styles.module.scss'

type ReleasesEmptyStateProps = {
  onCreate: () => void
}

export function ReleasesEmptyState({ onCreate }: ReleasesEmptyStateProps) {
  return (
    <div className={styles.root}>
      <Text as="h2" variant="bodyLg">Nenhum release cadastrado</Text>
      <Text as="p" variant="bodyMd" tone="muted">Crie o primeiro comunicado de imprensa para começar.</Text>
      <Button type="button" variant="primary" onClick={onCreate}>Criar release</Button>
    </div>
  )
}
