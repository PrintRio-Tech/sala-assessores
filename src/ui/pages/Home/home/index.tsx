import { useState } from 'react'
import { ActionTile, Card, Divider, Heading, Icon as DsIcon, ICONS, Text } from '@print/ui'
import { useNavigate } from 'react-router-dom'

import { useSession } from '@/application/modules/Auth/hooks/use-session'
import { useDemandActions } from '@/application/modules/Demand/hooks/use-demand-actions'
import { useDemands } from '@/application/modules/Demand/hooks/use-demands'
import { usePressRoomReport } from '@/application/modules/Report/hooks/use-press-room-report'
import { useJournalists } from '@/application/modules/Journalist/hooks/use-journalists'
import { DemandCreateDrawer } from '@/ui/pages/Demand/components/DemandCreateDrawer'
import { ROUTES } from '@/ui/routes/paths'
import { HOME_MONTH_KPI_COPY } from './constants'
import styles from './styles.module.scss'

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

function greetingFromSession(name: string | null | undefined): string {
  const trimmed = name?.trim()
  return trimmed ? `Olá, ${trimmed}` : 'Olá'
}

export function HomePage() {
  const navigate = useNavigate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { capture } = useDemandActions()
  const { data: journalists, isLoading: journalistsLoading } = useJournalists()
  const { session } = useSession()
  const { data: activeDemands } = useDemands({ lifecycle: 'active' })
  const { data: report } = usePressRoomReport()
  const monthKpis = [
    {
      id: 'demands',
      label: HOME_MONTH_KPI_COPY.demands.label,
      value: String(report?.demandCount ?? '—'),
      hint: `${report?.inProgressCount ?? 0} em andamento`,
    },
    {
      id: 'positionings',
      label: HOME_MONTH_KPI_COPY.positionings.label,
      value: String(report?.sentCount ?? '—'),
      hint: HOME_MONTH_KPI_COPY.positionings.hint,
    },
    {
      id: 'journalists',
      label: HOME_MONTH_KPI_COPY.journalists.label,
      value: String(report?.journalistCount ?? '—'),
      hint: HOME_MONTH_KPI_COPY.journalists.hint,
    },
  ]

  return (
    <div className={styles.homePage}>
      <header className={styles.greeting}>
        <Heading level={1} variant="xl" className={styles.greetingTitle}>
          {greetingFromSession(session?.name)}
        </Heading>
        <p className={styles.greetingSubtitle}>
          O que foi realizado neste mês?
        </p>
      </header>

      <section className={styles.section} aria-label="Indicadores do mês">
        <div className={styles.metricsGrid}>
          {monthKpis.map((kpi) => (
            <Card key={kpi.id} variant="elevated" padding="none" className={styles.metricCard} data-kpi-card>
              <span className={styles.metricDot} aria-hidden="true" />
              <Text as="p" variant="labelMd" tone="muted" className={styles.metricLabel}>
                {kpi.label}
              </Text>
              <Heading as="p" variant="lg" className={styles.metricValue}>{kpi.value}</Heading>
              <Text variant="labelSm" tone="muted">{kpi.hint}</Text>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-label="Continuar de onde parou">
        <SectionHeading title="Continuar de onde parou" />

        {activeDemands.length > 0 ? (
          <div className={styles.demandsList}>
            {activeDemands.slice(0, 5).map((demand) => (
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
        onCapture={(input) => {
          capture(input, {
            onSuccess: (record) => {
              setIsCreateOpen(false)
              navigate(ROUTES.demand(record.id))
            },
          })
        }}
        journalists={journalists}
        journalistsLoading={journalistsLoading}
      />
    </div>
  )
}
