import { Button, ICONS, Text } from '@print/ui'

import { Icon } from '@/ui/components/DsIcon'

import styles from './styles.module.scss'

type ReleaseCreateButtonProps = {
  onClick: () => void
}

export function ReleaseCreateButton({ onClick }: ReleaseCreateButtonProps) {
  return (
    <section aria-label="Novo release" className={styles.promo}>
      <span className={styles.decor} aria-hidden="true" />
      <Icon src={ICONS.home.addCircle} size={28} className={styles.icon} />
      <div className={styles.copy}>
        <Text as="p" variant="labelMd" className={styles.title}>Novo release</Text>
        <Text as="p" variant="labelSm" className={styles.description}>Cadastre um comunicado oficial.</Text>
      </div>
      <Button type="button" variant="secondary" size="sm" className={styles.cta} onClick={onClick}>
        Começar
        <Icon src={ICONS.home.arrowForward} size={16} aria-hidden />
      </Button>
    </section>
  )
}
