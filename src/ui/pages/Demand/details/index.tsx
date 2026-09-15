import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ActionGroup,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Heading,
  Icon,
  ICONS,
  PersonDetailedCell,
  Text,
} from '@print/ui'

import { useDemandDetailView } from '@/application/modules/Demand/hooks/use-demand-detail-view'
import { useJournalists } from '@/application/modules/Journalist/hooks/use-journalists'
import { useCreateJournalist } from '@/application/modules/Journalist/hooks/use-create-journalist'
import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'
import { collectDemandTags } from '@/application/modules/Demand/presentation/demand-tags'
import { toDemandCaptureRevision } from '@/application/modules/Demand/presentation/demand-list-filters'
import type { DemandDetailTimelineEvent, DemandDetailViewModel } from '@/application/modules/Demand/presentation/demand-detail.viewmodel'
import { ROUTES } from '@/ui/routes/paths'
import { DemandInteractionDrawer } from './DemandInteractionDrawer'
import { DemandPositioningDrawer } from './DemandPositioningDrawer'
import { DemandCreateDrawer } from './DemandCreateDrawer'
import { JournalistCreateDrawer } from './JournalistCreateDrawer'
import styles from './demand-detail.module.scss'

function isLocalDemandView(demand: DemandDetailViewModel): demand is Extract<DemandDetailViewModel, { isLocal: true }> {
  return 'isLocal' in demand
}

type CaptureIntent = 'edit' | null

function StackedField({ label, testId, children }: { label: string; testId: string; children: ReactNode }) {
  return (
    <div className={styles.stackedField} data-testid={testId}>
      <Text as="p" variant="labelSm" tone="muted">{label}</Text>
      <div>{children}</div>
    </div>
  )
}

function CopyCard({ title, testId, children }: { title: string; testId?: string; children: ReactNode }) {
  return (
    <Card variant="surface" padding="lg" className={styles.infoCard} data-testid={testId}>
      <Heading level={2} variant="sm">{title}</Heading>
      {children}
    </Card>
  )
}

function DetailHeader({
  demand,
  onWritePositioning,
  onRegisterInteraction,
  onEdit,
  onDelete,
}: {
  demand: DemandDetailViewModel
  onWritePositioning: () => void
  onRegisterInteraction: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const canWritePositioning = demand.validNextActions.includes('write_positioning') && demand.positioning.canEdit
  const canRegisterInteraction = demand.validNextActions.includes('register_interaction')
  const writeIsPrimary = demand.positioning.primaryAction === 'write_positioning'
  return (
    <header className={styles.detailHeader}>
      <ActionGroup align="between" className={styles.toolbar}>
        <Link to={ROUTES.demands} className={styles.back}>
          <Icon src={ICONS.ui.chevronLeft} size={20} aria-hidden />
          Voltar para demandas
        </Link>
        <ActionGroup aria-label="Ações da demanda">
          {canWritePositioning ? (
            <Button
              type="button"
              variant={writeIsPrimary ? 'primary' : 'outline'}
              size="sm"
              onClick={onWritePositioning}
            >
              {demand.positioning.writeLabel}
            </Button>
          ) : null}
          {canRegisterInteraction ? (
            <Button
              type="button"
              variant={writeIsPrimary ? 'outline' : 'primary'}
              size="sm"
              onClick={onRegisterInteraction}
            >
              Registrar interação
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" iconOnly aria-label="Editar" onClick={onEdit}>
            <Icon src={ICONS.table.edit} size={16} aria-hidden />
          </Button>
          <Button type="button" variant="outline" size="sm" iconOnly aria-label="Excluir" onClick={onDelete}>
            <Icon src={ICONS.table.delete} size={16} aria-hidden />
          </Button>
        </ActionGroup>
      </ActionGroup>
      <div className={styles.headerIdentity}>
        <Heading level={1}>{demand.identity.title}</Heading>
        <Text as="div" variant="bodyMd" tone="muted" className={styles.supportLine}>
          {demand.identity.code ? <span>{demand.identity.code}</span> : null}
          <Badge tone="neutral" size="sm">{demand.identity.statusLabel}</Badge>
        </Text>
      </div>
    </header>
  )
}

function PositioningCard({
  positioning,
  onWrite,
}: {
  positioning: DemandDetailViewModel['positioning']
  onWrite: () => void
}) {
  return (
    <Card variant="surface" padding="lg" className={`${styles.infoCard} ${styles.positioning}`} data-testid="demand-positioning">
      <div className={styles.positioningHeader}>
        <Heading level={2} variant="sm">Posicionamento</Heading>
        <Badge tone={positioning.state === 'empty' ? 'neutral' : positioning.state === 'approved' || positioning.state === 'sent' ? 'primary' : 'secondary'} size="sm">
          {positioning.stateLabel}
        </Badge>
      </div>
      {positioning.isEmpty ? (
        <Text as="p">Ainda sem resposta</Text>
      ) : (
        <Text as="p" className={styles.positioningBody}>{positioning.body}</Text>
      )}
      {positioning.approval ? (
        <Text as="p" variant="labelSm" tone="muted">
          Aprovado por {positioning.approval.approvedBy}
          {positioning.approval.opinion ? ` · ${positioning.approval.opinion}` : ''}
        </Text>
      ) : null}
      {positioning.canEdit && positioning.isEmpty ? (
        <div className={styles.positioningActions}>
          <Button type="button" variant="outline" size="sm" onClick={onWrite}>
            {positioning.writeLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  )
}

function Timeline({ events }: { events: DemandDetailTimelineEvent[] }) {
  return (
    <div className={styles.timeline}>
      {events.map((event) => (
        <article key={event.id} className={`${styles.timelineEvent} ${event.isAttention ? styles.attention : ''} ${event.isCurrent ? styles.current : ''}`}>
          <i className={styles.timelineDot} />
          <div className={styles.timelineMeta}>{event.actor ? <strong>{event.actor}</strong> : null}<small>{event.attribution}</small></div>
          <time dateTime={event.iso}>{event.dateLabel}<small>{event.timeLabel}</small></time>
          <h3>{event.title}</h3>
          {event.description ? <p>{event.description}</p> : null}
          {event.nextStep ? <footer><b>Próximo passo registrado</b>{event.nextStep}</footer> : null}
        </article>
      ))}
    </div>
  )
}

function capturedResponsibleName(name: string) {
  return name.trim() && name !== 'Ainda não atribuído' ? name : ''
}

export function DemandDetailPage() {
  const { demandId } = useParams()
  const navigate = useNavigate()
  const { data: demand, source, isLoading } = useDemandDetailView(demandId)
  const { data: journalists, isLoading: journalistsLoading } = useJournalists()
  const localRecords = useLocalDemandStore((state) => state.records)
  const [interactionOpen, setInteractionOpen] = useState(false)
  const [positioningOpen, setPositioningOpen] = useState(false)
  const [captureIntent, setCaptureIntent] = useState<CaptureIntent>(null)
  const [journalistOpen, setJournalistOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const initialCapture = useMemo(() => {
    if (!source) return undefined
    return 'pressRequest' in source
      ? toDemandCaptureRevision({ ...source, kind: 'local' })
      : toDemandCaptureRevision(source)
  }, [source])
  const createJournalist = useCreateJournalist({ onSuccess: (journalist) => {
    if (demandId) useLocalDemandStore.getState().linkJournalist(demandId, { journalistId: journalist.id, journalistName: journalist.name, outletName: journalist.outletName })
    setJournalistOpen(false)
  } })

  if (isLoading) return <div className={styles.statePage}><Text tone="muted">Carregando demanda…</Text></div>
  if (!demand) return <div className={styles.statePage}><EmptyState variant="empty" title="Demanda não encontrada" description="Volte à lista e selecione outra demanda." /></div>

  const ensureLocal = () => {
    if (!source) return null
    if ('pressRequest' in source) return source
    return useLocalDemandStore.getState().adopt(source)
  }
  const openEdit = () => setCaptureIntent('edit')
  const enrichment = demand.enrichment
  const sourceChannel = demand.sourceChannel.trim()
  const responsibleName = capturedResponsibleName(demand.identity.responsibleName)
  const tagSuggestions = collectDemandTags([...localRecords, { enrichment }])
  const confirmedFacts = enrichment.confirmedFacts.filter(Boolean)
  const pendingFacts = enrichment.pendingFacts.filter(Boolean)
  const captureNextStep = enrichment.nextStep?.trim() ?? ''
  const pressRequest = demand.requestSummary.trim()
  const factContext = demand.factContext.trim()
  const contactName = demand.identity.journalistName.trim()
  const outletName = demand.identity.outletName.trim()
  const journalist = journalists.find((item) => item.id === demand.identity.journalistId)
  const needsJournalist = isLocalDemandView(demand) && !demand.identity.journalistId
  const hasClassification = Boolean(enrichment.tags.length || enrichment.topics.length || enrichment.relatedAreas.length)

  return (
    <div className={styles.page} data-testid="demand-detail">
      <DetailHeader
        demand={demand}
        onWritePositioning={() => setPositioningOpen(true)}
        onRegisterInteraction={() => setInteractionOpen(true)}
        onEdit={openEdit}
        onDelete={() => setDeleteOpen(true)}
      />
      <div className={styles.historyLayout}>
        <aside className={styles.summaryRail} data-testid="demand-summary-rail" aria-label="Resumo da demanda">
          <CopyCard title="Caso" testId="demand-case-card">
            <div className={styles.stackedFields}>
              {contactName ? (
                <StackedField label="Contato" testId="stacked-contato">
                  <div className={styles.personDetail}>
                    <PersonDetailedCell
                      name={journalist?.name ?? contactName}
                      subtitle={journalist
                        ? [journalist.outletName, journalist.desk].filter(Boolean).join(' · ') || undefined
                        : outletName || undefined}
                      email={journalist?.email.trim() || undefined}
                      phone={journalist?.phone.trim() || undefined}
                      contactAction={demand.identity.journalistId
                        ? { label: 'Ver perfil', onClick: () => navigate(ROUTES.journalist(demand.identity.journalistId)) }
                        : undefined}
                    />
                  </div>
                  {needsJournalist ? (
                    <>
                      <Text as="p" variant="labelSm" tone="muted">Contato ainda não cadastrado</Text>
                      <Button variant="ghost" size="sm" onClick={() => setJournalistOpen(true)}>Cadastrar jornalista</Button>
                    </>
                  ) : null}
                </StackedField>
              ) : null}
              {outletName ? (
                <StackedField label="Veículo / redação" testId="stacked-veiculo">
                  {outletName}
                </StackedField>
              ) : null}
              {sourceChannel ? (
                <StackedField label="Canal" testId="stacked-canal">{sourceChannel}</StackedField>
              ) : null}
              {demand.identity.deadline.shortDate ? (
                <StackedField label="Prazo" testId="stacked-prazo">{demand.identity.deadline.shortDate}</StackedField>
              ) : null}
              {demand.identity.priorityLabel ? (
                <StackedField label="Prioridade" testId="stacked-prioridade">{demand.identity.priorityLabel}</StackedField>
              ) : null}
              {responsibleName ? (
                <StackedField label="Responsável" testId="stacked-responsavel">
                  <div className={styles.personDetail}><PersonDetailedCell name={responsibleName} /></div>
                </StackedField>
              ) : null}
              {demand.createdByName ? (
                <StackedField label="Registrado por" testId="stacked-registrado">{demand.createdByName}</StackedField>
              ) : null}
              <StackedField label="Criada em" testId="stacked-criada">{demand.lifecycle.createdAt.shortDate}</StackedField>
              <StackedField label="Atualizada em" testId="stacked-atualizada">{demand.lifecycle.updatedAt.shortDate}</StackedField>
            </div>
          </CopyCard>
          {hasClassification ? (
            <CopyCard title="Classificação" testId="demand-classification-card">
              <div className={styles.stackedFields}>
                {enrichment.tags.length ? (
                  <StackedField label="Tags" testId="stacked-tags">
                    <div className={styles.tagList}>
                      {enrichment.tags.map((tag) => <Badge key={tag} tone="secondary" size="sm">{tag}</Badge>)}
                    </div>
                  </StackedField>
                ) : null}
                {enrichment.topics.length ? (
                  <StackedField label="Tema" testId="stacked-tema">{enrichment.topics.join(' · ')}</StackedField>
                ) : null}
                {enrichment.relatedAreas.length ? (
                  <StackedField label="Áreas ou entidades" testId="stacked-areas">{enrichment.relatedAreas.join(' · ')}</StackedField>
                ) : null}
              </div>
            </CopyCard>
          ) : null}
        </aside>
        <div className={styles.mainStack}>
          <PositioningCard positioning={demand.positioning} onWrite={() => setPositioningOpen(true)} />
          {pressRequest ? (
            <CopyCard title="Pedido da imprensa" testId="demand-press-request">
              <Text as="p">{pressRequest}</Text>
            </CopyCard>
          ) : null}
          {factContext ? (
            <CopyCard title="O que aconteceu" testId="demand-fact-context">
              <Text as="p">{factContext}</Text>
            </CopyCard>
          ) : null}
          {confirmedFacts.length || pendingFacts.length ? (
            <CopyCard title="Apuração" testId="demand-investigation">
              {confirmedFacts.length ? (
                <div className={styles.stackedField}>
                  <Text as="p" variant="labelSm" tone="muted">Fatos confirmados</Text>
                  {confirmedFacts.map((fact) => <Text as="p" key={fact}>{fact}</Text>)}
                </div>
              ) : null}
              {pendingFacts.length ? (
                <div className={styles.stackedField}>
                  <Text as="p" variant="labelSm" tone="muted">Pendências</Text>
                  {pendingFacts.map((fact) => <Text as="p" key={fact}>{fact}</Text>)}
                </div>
              ) : null}
            </CopyCard>
          ) : null}
          {captureNextStep ? (
            <CopyCard title="Próximo passo" testId="demand-capture-next-step">
              <Text as="p">{captureNextStep}</Text>
            </CopyCard>
          ) : null}
          <CopyCard title="Histórico">
            <Timeline events={demand.timeline} />
          </CopyCard>
        </div>
      </div>
      <DemandPositioningDrawer
        demandId={demand.id}
        demandCode={demand.identity.code}
        demandTitle={demand.identity.title}
        initialBody={demand.positioning.body}
        open={positioningOpen}
        onOpenChange={setPositioningOpen}
      />
      <DemandInteractionDrawer
        demandId={demand.id}
        demandCode={demand.identity.code}
        demandTitle={demand.identity.title}
        positioningBody={demand.positioning.body}
        open={interactionOpen}
        onOpenChange={setInteractionOpen}
      />
      <DemandCreateDrawer
        open={Boolean(captureIntent)}
        mode="edit"
        intent="edit"
        initialCapture={initialCapture}
        journalists={journalists}
        journalistsLoading={journalistsLoading}
        tagSuggestions={tagSuggestions}
        onOpenChange={(open) => { if (!open) setCaptureIntent(null) }}
        onCapture={(capture) => {
          const local = ensureLocal()
          if (!local) return
          useLocalDemandStore.getState().updateCapture(local.id, capture)
          setCaptureIntent(null)
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir demanda?"
        description={`A demanda “${demand.identity.title}” (#${demand.identity.code}) será removida somente nesta sessão do protótipo e poderá reaparecer ao recarregar a aplicação.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => { useLocalDemandStore.getState().remove(demand.id); navigate(ROUTES.demands) }}
      />
      <JournalistCreateDrawer
        open={journalistOpen}
        onOpenChange={setJournalistOpen}
        onCreate={createJournalist.create}
        initialValue={isLocalDemandView(demand) ? {
          name: demand.localCapture.journalistName,
          outletName: demand.localCapture.outletName,
        } : undefined}
        topicSuggestions={enrichment.topics}
        isPending={createJournalist.isPending}
        error={createJournalist.error}
      />
    </div>
  )
}
