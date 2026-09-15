import { useState } from 'react'
import { ActionTile, Card, Divider, Heading, Icon as DsIcon, ICONS, Text } from '@print/ui'
import { useNavigate } from 'react-router-dom'

import { currentUser } from '@/application/current-user'
import { useJournalists } from '@/application/modules/Journalist/hooks/use-journalists'
import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'
import { DemandCreateDrawer } from './DemandCreateDrawer'
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

function SectionHeading({ title }: { title: string }) {
  return (
    <div className={styles.sectionHeader}>
      <Heading level={2} variant="md" className={styles.sectionTitle}>
        {title}
      </Heading>
      <Divider className={styles.sectionDivider} />
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const addLocalDemand = useLocalDemandStore((state) => state.add)
  const { data: journalists, isLoading: journalistsLoading } = useJournalists()

  return (
    <div className={styles.homePage}>
      <header className={styles.greeting}>
        <Heading level={1} variant="xl" className={styles.greetingTitle}>
          Olá, {currentUser.name}
        </Heading>
        <p className={styles.greetingSubtitle}>
          O que foi realizado neste mês?
        </p>
      </header>

      <section className={styles.section} aria-label="Indicadores do mês">
        <div className={styles.metricsGrid}>
          <Card variant="elevated" padding="none" className={styles.metricCard} data-kpi-card>
            <span className={styles.metricDot} aria-hidden="true" />
            <Text as="p" variant="labelMd" tone="muted" className={styles.metricLabel}>
              Demandas em setembro
            </Text>
            <Heading as="p" variant="lg" className={styles.metricValue}>8</Heading>
            <Text variant="labelSm" tone="muted">5 em andamento</Text>
          </Card>
          <Card variant="elevated" padding="none" className={styles.metricCard} data-kpi-card>
            <span className={styles.metricDot} aria-hidden="true" />
            <Text as="p" variant="labelMd" tone="muted" className={styles.metricLabel}>
              Posicionamentos enviados
            </Text>
            <Heading as="p" variant="lg" className={styles.metricValue}>3</Heading>
            <Text variant="labelSm" tone="muted">Taxa de aprovação 86%</Text>
          </Card>
          <Card variant="elevated" padding="none" className={styles.metricCard} data-kpi-card>
            <span className={styles.metricDot} aria-hidden="true" />
            <Text as="p" variant="labelMd" tone="muted" className={styles.metricLabel}>
              Interações com jornalistas
            </Text>
            <Heading as="p" variant="lg" className={styles.metricValue}>12</Heading>
            <Text variant="labelSm" tone="muted">E-mail, telefone, reunião</Text>
          </Card>
        </div>
      </section>

      <section className={styles.section} aria-label="Continuar de onde parou">
        <SectionHeading title="Continuar de onde parou" />

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

      <section className={styles.section} aria-label="Ações rápidas">
        <SectionHeading title="Ações rápidas" />
        <div className={styles.actionsGrid}>
          <ActionTile
            variant="primary"
            eyebrow="Iniciar registro"
            title="Nova demanda"
            icon={<DsIcon src={ICONS.home.addCircle} size={28} />}
            onClick={() => setIsCreateOpen(true)}
          />
          <ActionTile
            variant="outline"
            eyebrow="Cadastrar mídia"
            title="Novo jornalista"
            icon={<DsIcon src={ICONS.nav.journalists} size={28} />}
            onClick={() => navigate(ROUTES.journalists)}
          />
          <ActionTile
            variant="outline"
            eyebrow="Consultar casos"
            title="Ver demandas"
            icon={<DsIcon src={ICONS.nav.activities} size={28} />}
            onClick={() => navigate(ROUTES.demands)}
          />
          <ActionTile
            variant="muted"
            eyebrow="Resultados mensais"
            title="Ver relatórios"
            icon={<DsIcon src={ICONS.home.chart} size={28} />}
            onClick={() => navigate(ROUTES.reports)}
          />
        </div>
      </section>

      <DemandCreateDrawer
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCapture={(capture) => {
          const record = addLocalDemand(capture)
          setIsCreateOpen(false)
          navigate(ROUTES.demand(record.id))
        }}
        journalists={journalists}
        journalistsLoading={journalistsLoading}
      />
    </div>
  )
}
