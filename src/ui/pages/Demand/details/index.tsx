import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  PersonDetailedCell,
  Text,
} from '@print/ui'

import { useDemandDetailView } from '@/application/modules/Demand/hooks/use-demand-detail-view'
import { useLocalDemandActions } from '@/application/modules/Demand/hooks/use-local-demand-actions'
import { useJournalists } from '@/application/modules/Journalist/hooks/use-journalists'
import { useCreateJournalist } from '@/application/modules/Journalist/hooks/use-create-journalist'
import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'
import { collectDemandTags } from '@/application/modules/Demand/presentation/demand-tags'
import { toDemandCaptureRevision } from '@/application/modules/Demand/presentation/demand-list-filters'
import type { DemandDetailViewModel } from '@/application/modules/Demand/presentation/demand-detail.viewmodel'
import { ROUTES } from '@/ui/routes/paths'
import { DemandCreateDrawer } from '../components/DemandCreateDrawer'
import { JournalistCreateDrawer } from '@/ui/pages/Journalist/components/JournalistCreateDrawer'
import { DemandInteractionDrawer } from '../components/DemandInteractionDrawer'
import { DemandPositioningDrawer } from '../components/DemandPositioningDrawer'
import { CopyCard } from './components/CopyCard'
import { DetailHeader } from './components/DetailHeader'
import { PositioningCard } from './components/PositioningCard'
import { StackedField } from './components/StackedField'
import { Timeline } from './components/Timeline'
import styles from './styles.module.scss'

function isLocalDemandView(demand: DemandDetailViewModel): demand is Extract<DemandDetailViewModel, { isLocal: true }> {
  return 'isLocal' in demand
}

type CaptureIntent = 'edit' | null

function capturedResponsibleName(name: string) {
  return name.trim() && name !== 'Ainda não atribuído' ? name : ''
}

export function DemandDetailPage() {
  const { demandId } = useParams()
  const navigate = useNavigate()
  const { data: demand, source, isLoading } = useDemandDetailView(demandId)
  const { data: journalists, isLoading: journalistsLoading } = useJournalists()
  const { revise, remove, linkJournalist } = useLocalDemandActions()
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
    if (demandId) linkJournalist(demandId, { journalistId: journalist.id, journalistName: journalist.name, outletName: journalist.outletName })
    setJournalistOpen(false)
  } })

  if (isLoading) return <div className={styles.statePage}><Text tone="muted">Carregando demanda…</Text></div>
  if (!demand) return <div className={styles.statePage}><EmptyState variant="empty" title="Demanda não encontrada" description="Volte à lista e selecione outra demanda." /></div>

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
          if (!source) return
          revise(source, capture)
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
        onConfirm={() => { remove(demand.id, { onSuccess: () => navigate(ROUTES.demands) }) }}
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
