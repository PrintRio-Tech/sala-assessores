import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar, Badge, Button, Card, EmptyState, Heading, Text } from '@print/ui'

import { useDemandDetailView } from '@/application/modules/Demand/hooks/use-demand-detail-view'
import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'
import { useCreateJournalist } from '@/application/modules/Journalist/hooks/use-create-journalist'
import { currentUser } from '@/application/current-user'
import type { DemandDetailTimelineEvent, DemandDetailViewModel } from '@/application/modules/Demand/presentation/demand-detail.viewmodel'
import { Icon } from '@/ui/components/Icon'
import { ROUTES } from '@/ui/routes/paths'
import { DemandInteractionDrawer } from './DemandInteractionDrawer'
import { DemandEnrichmentDrawer } from './DemandEnrichmentDrawer'
import { DemandReviewDrawer } from './DemandReviewDrawer'
import { DemandDecisionDrawer } from './DemandDecisionDrawer'
import { DemandPositioningDrawer } from './DemandPositioningDrawer'
import { DemandVersionDrawer } from './DemandVersionDrawer'
import { DemandClosureDrawer } from './DemandClosureDrawer'
import { JournalistCreateDrawer } from './JournalistCreateDrawer'
import styles from './demand-detail.module.scss'

function isLocalDemandView(demand: DemandDetailViewModel): demand is Extract<DemandDetailViewModel, { isLocal: true }> {
  return 'isLocal' in demand
}

type WorkflowDrawer = 'enrich' | 'review' | 'decision' | 'version' | 'positioning' | 'closure' | null

const primaryAction = {
  enrich: 'Enriquecer demanda', request_review: 'Solicitar review', record_decision: 'Registrar decisão', record_version: 'Nova versão', record_positioning: 'Registrar posicionamento', close_without_send: 'Encerrar sem envio', register_interaction: 'Registrar interação',
} as const

function DetailHeader({ demand, onRegisterInteraction, onAction }: { demand: DemandDetailViewModel; onRegisterInteraction: () => void; onAction: (drawer: WorkflowDrawer) => void }) {
  const nextAction = demand.validNextActions.find((action) => action !== 'register_interaction' && action !== 'close_without_send')
  const drawerByAction = { enrich: 'enrich', request_review: 'review', record_decision: 'decision', record_version: 'version', record_positioning: 'positioning' } as const
  return (
    <header className={styles.detailHeader}>
      <Link className={styles.backButton} to={ROUTES.demands} aria-label="Voltar às demandas"><Icon name="arrow-left" /></Link>
      <div className={styles.headerIdentity}>
        <Text as="p" variant="labelSm" tone="primary" className={styles.eyebrow}>Demanda · {demand.identity.code}</Text>
        <Heading level={1}>{demand.identity.title}</Heading>
        <div className={styles.headerMeta}>
          {demand.identity.journalistId ? <Link to={ROUTES.journalist(demand.identity.journalistId)}>{demand.identity.journalistName} · {demand.identity.outletName}</Link> : <span>{demand.identity.journalistName}{demand.identity.outletName ? ` · ${demand.identity.outletName}` : ''}</span>}
          <Badge tone="neutral" size="sm">{demand.identity.statusLabel}</Badge>
          {!isLocalDemandView(demand) ? <span>Prioridade {demand.identity.priorityLabel}</span> : null}
          <span>{isLocalDemandView(demand) ? `Prazo solicitado: ${demand.identity.deadline.timeLabel}` : `Prazo ${demand.identity.deadline.dateLabel}, ${demand.identity.deadline.timeLabel}`}</span>
          <span>Criada em {demand.lifecycle.createdAt.dateLabel}, {demand.lifecycle.createdAt.timeLabel}</span>
          <span>Atualizada em {demand.lifecycle.updatedAt.dateLabel}, {demand.lifecycle.updatedAt.timeLabel}</span>
        </div>
      </div>
      <div className={styles.actions}>
        <Button variant="outline" onClick={onRegisterInteraction}>Registrar interação</Button>
        {demand.validNextActions.includes('close_without_send') ? <Button variant="ghost" onClick={() => onAction('closure')}>Encerrar sem envio</Button> : null}
        {nextAction ? <Button onClick={() => onAction(drawerByAction[nextAction as keyof typeof drawerByAction])}>{primaryAction[nextAction]}</Button> : null}
      </div>
    </header>
  )
}

function Owner({ name }: { name: string }) {
  return (
    <div className={styles.owner}>
      <Avatar name={name} size="sm" />
      <span><small>Responsável</small><strong>{name}</strong></span>
      <Button variant="ghost" size="sm" iconOnly aria-label="Editar responsável"><Icon name="edit" /></Button>
    </div>
  )
}

function Positioning({ demand }: { demand: DemandDetailViewModel }) {
  if (demand.positioning.state === 'missing') {
    return (
      <div className={styles.gapState}>
        <Icon name="edit" />
        <span><strong>{demand.positioning.label}</strong><small>Artefato final ainda não registrado nesta demanda.</small></span>
      </div>
    )
  }

  return (
    <div className={styles.positioning}>
      <strong>{demand.positioning.label}</strong>
      <p>{demand.positioning.body}</p>
      <small>{demand.positioning.channel} · {demand.positioning.recipient} · {demand.positioning.dateLabel}</small>
    </div>
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


export function DemandDetailPage() {
  const { demandId } = useParams()
  const { data: demand, source, isLoading } = useDemandDetailView(demandId)
  const [interactionOpen, setInteractionOpen] = useState(false)
  const [workflowDrawer, setWorkflowDrawer] = useState<WorkflowDrawer>(null)
  const [journalistOpen, setJournalistOpen] = useState(false)
  const createJournalist = useCreateJournalist({ onSuccess: (journalist) => {
    if (demandId) useLocalDemandStore.getState().linkJournalist(demandId, { journalistId: journalist.id, journalistName: journalist.name, outletName: journalist.outletName })
    setJournalistOpen(false)
  } })

  if (isLoading) return <div className={styles.statePage}><Text tone="muted">Carregando demanda…</Text></div>
  if (!demand) return <div className={styles.statePage}><EmptyState variant="empty" title="Demanda não encontrada" description="Volte à lista e selecione outra demanda." /></div>

  const ensureLocal = () => {
    if (!source) return null
    if ('factContext' in source) return source
    return useLocalDemandStore.getState().adopt(source)
  }
  const openWorkflow = (drawer: WorkflowDrawer) => { ensureLocal(); setWorkflowDrawer(drawer) }
  const enrichment = demand.enrichment

  return (
    <div className={styles.page} data-testid="demand-detail">
      <DetailHeader demand={demand} onRegisterInteraction={() => setInteractionOpen(true)} onAction={openWorkflow} />
      <div className={styles.historyLayout}>
        <aside className={styles.summaryRail}>
          <Card variant="surface" padding="lg">
            <Heading level={2} variant="lg">Estado atual</Heading>
            {isLocalDemandView(demand) ? (
              <dl className={styles.facts}>
                <div><dt>Onde está</dt><dd>{demand.identity.statusLabel}</dd></div>
                <div><dt>Prazo</dt><dd>{demand.identity.deadline.dateLabel}<small>{demand.identity.deadline.timeLabel}</small></dd></div>
              </dl>
            ) : <dl className={styles.facts}>
              <div><dt>Onde está</dt><dd>{demand.identity.statusLabel}</dd></div>
              <div><dt>Prazo</dt><dd>{demand.identity.deadline.dateLabel}<small>{demand.identity.deadline.timeLabel}</small></dd></div>
            </dl>}
          </Card>
          <Card variant="surface" padding="lg">
            <Text as="p" variant="labelSm" tone="primary">Pedido da imprensa</Text>
            <p className={styles.context}>{demand.requestSummary}</p>
          </Card>
          <Card variant="surface" padding="lg">
            <Heading level={2} variant="sm">Fato e contexto</Heading>
            <Text>{isLocalDemandView(demand) ? demand.factContext : 'Ainda não há fato ou contexto enriquecido neste caso.'}</Text>
          </Card>
          <Card variant="surface" padding="lg">
            <Heading level={2} variant="sm">Enriquecimento</Heading>
            <div className={styles.enrichmentBlock}><b>Tags</b><div className={styles.tagList}>{enrichment.tags.length ? enrichment.tags.map((tag) => <span key={tag}>{tag}</span>) : <small>Nenhuma tag registrada.</small>}</div></div>
            <div className={styles.enrichmentBlock}><b>Tema / área</b><span>{[...enrichment.topics, ...enrichment.relatedAreas].join(' · ') || 'Ainda não informados.'}</span></div>
            <div className={styles.enrichmentBlock}><b>Fatos confirmados</b><span>{enrichment.confirmedFacts.join(' · ') || 'Nenhum fato confirmado.'}</span></div>
            <div className={styles.enrichmentBlock}><b>Pendências</b><span>{enrichment.pendingFacts.join(' · ') || 'Sem pendências registradas.'}</span></div>
          </Card>
          <Card variant="surface" padding="lg">
            <Heading level={2} variant="sm">Operação</Heading>
            {!isLocalDemandView(demand) ? <Owner name={demand.identity.responsibleName} /> : null}
            <dl className={styles.facts}><div><dt>Responsável</dt><dd>{demand.identity.responsibleName}</dd></div><div><dt>Prioridade</dt><dd>{demand.identity.priorityLabel}</dd></div><div><dt>Próximo passo</dt><dd>{enrichment.nextStep || demand.currentState.latestRecordedNextStep || 'Ainda não registrado.'}</dd></div></dl>
          </Card>
          {isLocalDemandView(demand) ? <Card variant="surface" padding="lg">
            <Heading level={2} variant="sm">Recebimento</Heading>
            <Text>{demand.localCapture.journalistName} · {demand.localCapture.outletName}</Text>
            <Text tone="muted">Canal: {demand.sourceChannel} · Prazo solicitado: {demand.localCapture.requestedDeadline}</Text>
          </Card> : null}
          {isLocalDemandView(demand) && !demand.identity.journalistId ? <Card variant="surface" padding="lg"><Heading level={2} variant="sm">Contato local</Heading><Text tone="muted">A captura continua válida sem jornalista cadastrado.</Text><Button variant="outline" size="sm" onClick={() => setJournalistOpen(true)}>Enriquecer / converter em jornalista</Button></Card> : null}
          <Card variant="surface" padding="lg">
            <Heading level={2} variant="sm">Última decisão registrada</Heading>
            <div className={styles.railSection}>
              <Text tone="muted">{demand.currentState.latestDecisionSummary}</Text>
            </div>
          </Card>
          {demand.currentState.latestInteractionResult ? (
            <Card variant="surface" padding="lg">
              <Heading level={2} variant="sm">Último resultado de interação</Heading>
              <div className={styles.railSection}>
                <Text tone="muted">{demand.currentState.latestInteractionResult}</Text>
              </div>
            </Card>
          ) : null}
          {demand.currentState.latestRecordedNextStep ? (
            <Card variant="surface" padding="lg">
              <Heading level={2} variant="sm">Próximo passo registrado</Heading>
              <div className={styles.railSection}>
                <Text tone="muted">{demand.currentState.latestRecordedNextStep}</Text>
              </div>
            </Card>
          ) : null}
          <Card variant="surface" padding="lg"><Heading level={2} variant="sm">Posicionamento final</Heading><Positioning demand={demand} /></Card>
        </aside>
        <Card variant="surface" padding="lg" className={styles.timelinePanel}>
          <div className={styles.sectionHeading}>
            <div><Text as="p" variant="labelSm" tone="primary">O que aconteceu</Text><Heading level={2}>Histórico da demanda</Heading></div>
            <Badge tone="neutral" size="sm">Ordem cronológica</Badge>
          </div>
          <Timeline events={demand.timeline} />
        </Card>
      </div>
      <DemandInteractionDrawer
        demandId={demand.id}
        demandCode={demand.identity.code}
        demandTitle={demand.identity.title}
        open={interactionOpen}
        onOpenChange={setInteractionOpen}
      />
      <DemandEnrichmentDrawer open={workflowDrawer === 'enrich'} onOpenChange={(open) => setWorkflowDrawer(open ? 'enrich' : null)} responsibleOptions={[{ value: currentUser.id, label: currentUser.name }, { value: 'r-ana', label: 'Ana Paula' }, { value: 'r-bruno', label: 'Bruno Costa' }]} initialValue={{ tags: enrichment.tags, topic: enrichment.topics[0] ?? '', area: enrichment.relatedAreas[0] ?? '', confirmedFacts: enrichment.confirmedFacts.join('\n'), pendingItems: enrichment.pendingFacts.join('\n'), responsibleId: isLocalDemandView(demand) ? undefined : undefined, priority: demand.identity.priorityLabel === 'Crítica' ? 'urgent' : demand.identity.priorityLabel === 'Alta' ? 'high' : demand.identity.priorityLabel === 'Baixa' ? 'low' : 'normal', nextStep: enrichment.nextStep ?? '' }} onSave={(input) => { const local = ensureLocal(); if (!local) return; const responsibleName = [{ value: currentUser.id, label: currentUser.name }, { value: 'r-ana', label: 'Ana Paula' }, { value: 'r-bruno', label: 'Bruno Costa' }].find((item) => item.value === input.responsibleId)?.label ?? currentUser.name; useLocalDemandStore.getState().enrich(local.id, { tags: input.tags, topics: input.topic ? [input.topic] : [], relatedAreas: input.area ? [input.area] : [], confirmedFacts: input.confirmedFacts.split('\n').map((item) => item.trim()).filter(Boolean), pendingFacts: input.pendingItems.split('\n').map((item) => item.trim()).filter(Boolean), responsibleId: input.responsibleId || currentUser.id, responsibleName, priority: input.priority === 'urgent' ? 'critical' : input.priority === 'normal' ? 'medium' : input.priority, nextStep: input.nextStep }); setWorkflowDrawer(null) }} />
      <DemandReviewDrawer open={workflowDrawer === 'review'} onOpenChange={(open) => setWorkflowDrawer(open ? 'review' : null)} reviewerOptions={[{ value: 'Coordenação', label: 'Coordenação' }, { value: 'Jurídico', label: 'Jurídico' }]} onSubmit={(input) => { const local = ensureLocal(); if (!local) return; useLocalDemandStore.getState().requestReview(local.id, { reviewer: input.reviewerId, versionLabel: input.version, requestedBy: currentUser.name }); setWorkflowDrawer(null) }} />
      <DemandDecisionDrawer open={workflowDrawer === 'decision'} onOpenChange={(open) => setWorkflowDrawer(open ? 'decision' : null)} initialValue={{ decider: currentUser.name }} onSubmit={(input) => { const local = ensureLocal(); if (!local) return; useLocalDemandStore.getState().recordDecision(local.id, { outcome: input.decision === 'approve' ? 'approved' : input.decision === 'reject' ? 'rejected' : 'changes_requested', rationale: input.rationale, decidedBy: input.decider, decidedAt: new Date() }); setWorkflowDrawer(null) }} />
      <DemandVersionDrawer open={workflowDrawer === 'version'} onOpenChange={(open) => setWorkflowDrawer(open ? 'version' : null)} onSubmit={(input) => { const local = ensureLocal(); if (!local) return; useLocalDemandStore.getState().recordVersion(local.id, { versionLabel: input.version, body: input.body, createdAt: new Date(`${input.date}T12:00:00`), createdBy: currentUser.name }); setWorkflowDrawer(null) }} />
      <DemandPositioningDrawer open={workflowDrawer === 'positioning'} onOpenChange={(open) => setWorkflowDrawer(open ? 'positioning' : null)} onSubmit={(input) => { const local = ensureLocal(); if (!local) return; useLocalDemandStore.getState().recordPositioning(local.id, { versionLabel: input.version, channel: input.channel, recipient: input.recipient, body: input.body, sentAt: new Date(`${input.date}T12:00:00`), recordedBy: currentUser.name }); setWorkflowDrawer(null) }} />
      <DemandClosureDrawer open={workflowDrawer === 'closure'} onOpenChange={(open) => setWorkflowDrawer(open ? 'closure' : null)} onConfirm={(input) => { const local = ensureLocal(); if (!local) return; useLocalDemandStore.getState().closeWithoutSend(local.id, { reason: input.reason, closedBy: currentUser.name }); setWorkflowDrawer(null) }} />
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
