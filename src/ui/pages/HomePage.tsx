import { Button, Card, Heading, Icon as DsIcon, ICONS, Stat, Text } from '@print/ui'
import { useNavigate } from 'react-router-dom'

import { currentUser } from '@/application/current-user'
import { ROUTES } from '@/ui/routes/paths'
import styles from './home-page.module.scss'

interface MockDemandInProgress {
  id: string
  code: string
  title: string
  responsibleName: string
}

const MOCK_DEMANDS_IN_PROGRESS: MockDemandInProgress[] = [
  { id: 'd-ceo', code: 'TEC-889', title: 'Entrevista exclusiva: CEO TechCorp', responsibleName: 'Ana Paula' },
  { id: 'd-portos', code: 'ECO-442', title: 'Crise Logística: Impacto nos Portos', responsibleName: 'Ricardo M.' },
]

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className={styles.homePage}>
      <header className={styles.greeting}>
        <Heading level={1} className={styles.greetingTitle}>
          Olá, {currentUser.name}
        </Heading>
        <Text tone="muted" className={styles.greetingSubtitle}>
          O que foi realizado neste mês?
        </Text>
      </header>

      <section className={styles.metrics}>
        <Card padding="lg" className={styles.metricCard}>
          <Stat
            label="Demandas em setembro"
            value={8}
            trend={{ direction: 'neutral', label: '5 em andamento' }}
          />
        </Card>
        <Card padding="lg" className={styles.metricCard}>
          <Stat
            label="Posicionamentos enviados"
            value={3}
            trend={{ direction: 'neutral', label: 'Taxa de aprovação 86%' }}
          />
        </Card>
        <Card padding="lg" className={styles.metricCard}>
          <Stat
            label="Interações com jornalistas"
            value={12}
            trend={{ direction: 'neutral', label: 'E-mail, telefone, reunião' }}
          />
        </Card>
      </section>

      <section className={styles.continueSection}>
        <div className={styles.sectionHeader}>
          <Heading level={2} variant="sm">
            Continuar de onde parou
          </Heading>
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.demands)}
          >
            Nova demanda
          </Button>
        </div>

        {MOCK_DEMANDS_IN_PROGRESS.length > 0 ? (
          <div className={styles.demandsList}>
            {MOCK_DEMANDS_IN_PROGRESS.map((demand) => (
              <button
                key={demand.id}
                type="button"
                className={styles.demandItem}
                onClick={() => navigate(ROUTES.demand(demand.id))}
              >
                <span className={styles.demandCode}>{demand.code}</span>
                <span className={styles.demandTitle}>{demand.title}</span>
                <span className={styles.demandResponsible}>{demand.responsibleName}</span>
              </button>
            ))}
          </div>
        ) : (
          <Card padding="lg" className={styles.emptyState}>
            <Text tone="muted" className={styles.emptyText}>
              Nenhuma demanda em andamento para retomar.
            </Text>
          </Card>
        )}
      </section>

      <section className={styles.quickActions}>
        <Heading level={2} variant="sm" className={styles.actionsHeading}>
          Ações rápidas
        </Heading>

        <div className={styles.actionsGrid}>
          <Card variant="action" padding="lg" className={styles.actionTilePrimary}>
            <div className={styles.actionContent}>
              <div className={styles.actionIcon}>
                <DsIcon src={ICONS.home.addCircle} size={24} />
              </div>
              <div className={styles.actionCopy}>
                <Text variant="labelSm" tone="inverse" className={styles.actionLabel}>
                  Iniciar registro
                </Text>
                <Heading level={3} variant="sm" className={styles.actionTitle}>
                  Nova demanda
                </Heading>
              </div>
            </div>
            <Button type="button" variant="ghost" onClick={() => navigate(ROUTES.demands)}>
              Ir para demandas
              <DsIcon src={ICONS.home.arrowForward} size={18} aria-hidden="true" />
            </Button>
          </Card>

          <Card variant="action" padding="lg" className={styles.actionTile}>
            <div className={styles.actionContent}>
              <div className={styles.actionIcon}>
                <DsIcon src={ICONS.nav.journalists} size={24} />
              </div>
              <div className={styles.actionCopy}>
                <Text variant="labelSm" className={styles.actionLabel}>
                  Consultar contatos
                </Text>
                <Heading level={3} variant="sm" className={styles.actionTitle}>
                  Jornalistas
                </Heading>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.journalists)}>
              Ver jornalistas
              <DsIcon src={ICONS.home.arrowForward} size={18} aria-hidden="true" />
            </Button>
          </Card>

          <Card variant="action" padding="lg" className={styles.actionTile}>
            <div className={styles.actionContent}>
              <div className={styles.actionIcon}>
                <DsIcon src={ICONS.nav.reports} size={24} />
              </div>
              <div className={styles.actionCopy}>
                <Text variant="labelSm" className={styles.actionLabel}>
                  Resultados mensais
                </Text>
                <Heading level={3} variant="sm" className={styles.actionTitle}>
                  Relatórios
                </Heading>
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
