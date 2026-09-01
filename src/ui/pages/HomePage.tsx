import { Button, Card, Heading, Icon as DsIcon, ICONS, Stat, Text } from '@print/ui'
import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@/ui/routes/paths'
import styles from '@/ui/styles/design.module.scss'

export function HomePage() {
  const navigate = useNavigate()

  const mockStats = {
    activeDemandsCount: 12,
    pendingReviewCount: 3,
    journalistsCount: 47,
    interactionsThisMonth: 28,
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeading}>
        <div>
          <Text as="p" variant="labelSm" tone="primary" className={styles.eyebrow}>Central de atendimento à imprensa</Text>
          <Heading level={1} className={styles.pageTitle}>Sala de Assessores</Heading>
          <Text tone="muted">Acompanhe métricas e acesse recursos rapidamente.</Text>
        </div>
      </header>

      <section aria-label="Métricas do mês">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <Stat
            label="Demandas ativas"
            value={mockStats.activeDemandsCount}
            trend={{ direction: 'up', label: '+2 esta semana' }}
          />
          <Stat
            label="Aguardando review"
            value={mockStats.pendingReviewCount}
            tone="warning"
          />
          <Stat
            label="Jornalistas cadastrados"
            value={mockStats.journalistsCount}
          />
          <Stat
            label="Interações no mês"
            value={mockStats.interactionsThisMonth}
            trend={{ direction: 'up', label: '+8 vs. mês anterior' }}
          />
        </div>
      </section>

      <section aria-label="Atalhos">
        <Heading level={2} variant="sm" style={{ marginBottom: '16px' }}>Ações rápidas</Heading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <Card variant="action" padding="lg" data-layout="horizontal">
            <div className={styles.createContent}>
              <div className={styles.createIcon}>
                <DsIcon src={ICONS.home.addCircle} size={24} />
              </div>
              <div className={styles.createCopy}>
                <Heading level={3} variant="sm" data-typography="compact">Nova demanda</Heading>
                <Text variant="labelMd">Registre a entrada de imprensa</Text>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.demands)}>
              Ir para demandas
              <DsIcon src={ICONS.home.arrowForward} size={18} aria-hidden="true" />
            </Button>
          </Card>

          <Card variant="action" padding="lg" data-layout="horizontal">
            <div className={styles.createContent}>
              <div className={styles.createIcon}>
                <DsIcon src={ICONS.nav.journalists} size={24} />
              </div>
              <div className={styles.createCopy}>
                <Heading level={3} variant="sm" data-typography="compact">Jornalistas</Heading>
                <Text variant="labelMd">Consulte contatos e relacionamento</Text>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.journalists)}>
              Ver jornalistas
              <DsIcon src={ICONS.home.arrowForward} size={18} aria-hidden="true" />
            </Button>
          </Card>

          <Card variant="action" padding="lg" data-layout="horizontal">
            <div className={styles.createContent}>
              <div className={styles.createIcon}>
                <DsIcon src={ICONS.nav.activities} size={24} />
              </div>
              <div className={styles.createCopy}>
                <Heading level={3} variant="sm" data-typography="compact">Demandas em andamento</Heading>
                <Text variant="labelMd">Acompanhe casos ativos</Text>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={() => navigate(`${ROUTES.demands}?lifecycle=active`)}>
              Ver ativas
              <DsIcon src={ICONS.home.arrowForward} size={18} aria-hidden="true" />
            </Button>
          </Card>

          <Card variant="action" padding="lg" data-layout="horizontal">
            <div className={styles.createContent}>
              <div className={styles.createIcon}>
                <DsIcon src={ICONS.nav.reports} size={24} />
              </div>
              <div className={styles.createCopy}>
                <Heading level={3} variant="sm" data-typography="compact">Relatórios</Heading>
                <Text variant="labelMd">Indicadores e exportações</Text>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.reports)}>
              Ver relatórios
              <DsIcon src={ICONS.home.arrowForward} size={18} aria-hidden="true" />
            </Button>
          </Card>
        </div>
      </section>
    </div>
  )
}
