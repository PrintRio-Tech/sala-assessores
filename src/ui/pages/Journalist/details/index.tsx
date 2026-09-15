import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, Badge, Button, Card, EmptyState, Heading, Stat, Text } from '@print/ui'

import { useJournalist } from '@/application/modules/Journalist/hooks/use-journalist'
import { getJournalistDemandStatusLabel } from '@/application/modules/Journalist/presentation/journalist-profile.viewmodel'
import { useRegisterRelationshipEvaluation } from '@/application/modules/Journalist/hooks/use-register-relationship-evaluation'
import { useUpdateJournalist } from '@/application/modules/Journalist/hooks/use-update-journalist'
import { useJournalists } from '@/application/modules/Journalist/hooks/use-journalists'
import { useLocalDemandActions } from '@/application/modules/Demand/hooks/use-local-demand-actions'
import { formatPercent, formatScore } from '@/shared/format'
import { ROUTES } from '@/ui/routes/paths'
import { Icon } from '@/ui/components/Icon'
import { DemandCreateDrawer } from '@/ui/pages/Demand/components/DemandCreateDrawer'
import { JournalistCreateDrawer } from '../components/JournalistCreateDrawer'
import { JournalistEvaluationDrawer } from '../components/JournalistEvaluationDrawer'
import styles from '@/ui/styles/design.module.scss'

function shortDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(value)
}

function recordedDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(value)
}

function BackToJournalists() {
  return <Link className={styles.backLink} to={ROUTES.journalists}><Icon name="arrow-left" />Voltar para jornalistas</Link>
}

export function JournalistPage() {
  const { journalistId } = useParams()
  const id = journalistId ?? ''
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [evaluationOpen, setEvaluationOpen] = useState(false)
  const [demandCreateOpen, setDemandCreateOpen] = useState(false)
  const { data: journalist, isLoading } = useJournalist(journalistId)
  const { data: journalists, isLoading: journalistsLoading } = useJournalists()
  const { capture } = useLocalDemandActions()
  const updateMutation = useUpdateJournalist(id, { onSuccess: () => setEditOpen(false) })
  const evaluationMutation = useRegisterRelationshipEvaluation(id, { onSuccess: () => setEvaluationOpen(false) })

  if (isLoading) return <main className={`${styles.page} ${styles.journalistPage}`}><BackToJournalists /><div className={styles.statePage}><Text tone="muted">Carregando perfil…</Text></div></main>
  if (!journalist) return <main className={`${styles.page} ${styles.journalistPage}`}><BackToJournalists /><div className={styles.statePage}><EmptyState variant="empty" title="Jornalista não encontrado" description="Selecione outro perfil." /></div></main>
  const evaluation = journalist.relationshipEvaluations[0]

  return (
    <main className={`${styles.page} ${styles.journalistPage}`}>
      <BackToJournalists />

      <section className={styles.profileHero}>
        <Avatar name={journalist.name} src={journalist.id === 'j-carolina' ? '/images/carolina-montenegro.png' : undefined} size="lg" className={styles.profileAvatar} />
        <div className={styles.profileIdentity}>
          <Badge tone={journalist.isActive ? 'success' : 'neutral'} size="sm">{journalist.isActive ? 'Ativa' : 'Inativa'}</Badge>
          <Heading level={1} variant="lg">{journalist.name}</Heading>
          <Text tone="muted">{journalist.roleTitle} · {journalist.outletName}</Text>
          <div><Badge tone="outline">{journalist.desk}</Badge></div>
        </div>
        <div className={styles.headingActions}>
          <Button type="button" variant="outline" onClick={() => { updateMutation.reset(); setEditOpen(true) }}>Editar perfil</Button>
          <Button type="button" variant="primary" onClick={() => setDemandCreateOpen(true)}><Icon name="plus" />Nova demanda</Button>
        </div>
      </section>

      <section aria-label="Dados objetivos do jornalista">
        <section className={styles.metricsGrid}>
          <Card variant="surface" padding="lg" className={styles.metric}><Stat label="Total de demandas" value={String(journalist.objectiveStats.totalDemands)} /><small>{journalist.objectiveStats.solicitedCount} solicitadas · {journalist.objectiveStats.proactiveCount} proativas</small></Card>
          <Card variant="surface" padding="lg" className={styles.metric}><Stat label="Aproveitamento" value={formatPercent(journalist.objectiveStats.successRate)} /><svg className={styles.sparkline} viewBox="0 0 72 32" aria-hidden="true"><path d="M2 25 C10 20, 13 27, 20 21 S29 7, 35 17 S44 28, 49 13 S56 4, 59 18 S66 19, 70 5" /></svg></Card>
          <Card variant="surface" padding="lg" className={styles.metric}><Stat label="Uso de posicionamento" value={formatPercent(journalist.objectiveStats.positioningUsageRate)} /><div className={styles.progress}><i style={{ width: formatPercent(journalist.objectiveStats.positioningUsageRate) }} /></div><small>Frequência alta</small></Card>
          <Card variant="surface" padding="lg" className={styles.contact}><div><Text as="span" variant="labelSm" tone="muted">Informações de contato</Text>{journalist.email ? <a href={`mailto:${journalist.email}`}><Icon name="mail" /><b>{journalist.preferredChannel === 'email' ? 'E-mail preferencial' : 'E-mail corporativo'}</b>{journalist.email}</a> : <span className={styles.contactUnavailable} aria-label="E-mail não informado"><Icon name="mail" /><b>E-mail</b>Não informado</span>}{journalist.phone ? <a href={`tel:${journalist.phone}`}><Icon name="phone" /><b>{journalist.preferredChannel === 'whatsapp' ? 'WhatsApp preferencial' : journalist.preferredChannel === 'phone' ? 'Telefone preferencial' : 'Telefone'}</b>{journalist.phone}</a> : <span className={styles.contactUnavailable} aria-label="Telefone não informado"><Icon name="phone" /><b>Telefone</b>Não informado</span>}</div></Card>
        </section>

        <section className={styles.coverageSection}>
          <h2>Foco de cobertura</h2>
          <div className={styles.coveragePanel}><div className={styles.topicList}>{journalist.topics.map((topic, index) => <span className={index < 3 ? styles.topicStrong : ''} key={topic}>{topic}</span>)}</div><div className={styles.contactWindow}><Icon name="clock" /><span><small>Melhor horário para contato</small>{journalist.bestContactWindow || 'Não informado'}</span></div></div>
        </section>

        <section className={styles.historySection}><h2>Histórico recente</h2><div className={styles.historyPanel}>{journalist.demandHistory.map((item) => <Link key={item.demandId} to={ROUTES.demand(item.demandId)}><i /><span><small>{item.kindLabel}</small><strong>{item.title}</strong><em>{getJournalistDemandStatusLabel(item.status)}</em></span><time dateTime={item.occurredAt.toISOString()}>{shortDate(item.occurredAt)}</time></Link>)}</div></section>
      </section>

      <section className={styles.evaluationSection} aria-label="Avaliações registradas">
        <div className={styles.sectionHeading}>
          <div><h2>Avaliações registradas</h2><Text tone="muted" variant="labelSm">Percepções documentadas manualmente, sempre com autor e data.</Text></div>
          <Button type="button" variant="outline" size="sm" onClick={() => { evaluationMutation.reset(); setEvaluationOpen(true) }}>Registrar avaliação</Button>
        </div>
        {evaluation ? (
          <div className={styles.evaluationList}>
            {journalist.relationshipEvaluations.map((item) => (
              <article className={styles.behaviorPanel} key={item.id}>
                <Text as="p" variant="labelSm" tone="muted" className={styles.evaluationDisclaimer}>Registro datado — não é fato inferido pelo sistema.</Text>
                <div className={styles.behaviorTop}><span><small>Tom editorial registrado</small><strong>{item.editorialToneLabel}</strong></span><span><small>Nota de relacionamento</small><strong>{formatScore(item.score)} / 5</strong></span></div>
                <div className={styles.traits}>{item.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
                {item.notes ? <p>{item.notes}</p> : <p>Sem observações adicionais.</p>}
                <footer>Registrada por <strong>{item.authorName}</strong> em <time dateTime={item.recordedAt.toISOString()}>{recordedDate(item.recordedAt)}</time></footer>
              </article>
            ))}
          </div>
        ) : <div className={styles.behaviorPanel}><EmptyState variant="empty" title="Nenhuma avaliação registrada" description="Registre uma percepção observada com autor e data; ela não será tratada como fato objetivo." /></div>}
      </section>

      <JournalistCreateDrawer mode="edit" open={editOpen} onOpenChange={setEditOpen} onCreate={() => undefined} onSave={updateMutation.update} initialProfile={journalist} topicSuggestions={journalist.topics} isPending={updateMutation.isPending} error={updateMutation.error} />
      <JournalistEvaluationDrawer open={evaluationOpen} onOpenChange={setEvaluationOpen} onRegister={evaluationMutation.register} isPending={evaluationMutation.isPending} error={evaluationMutation.error} />
      <DemandCreateDrawer
        open={demandCreateOpen}
        onOpenChange={setDemandCreateOpen}
        onCapture={(input) => {
          capture(input, {
            onSuccess: (record) => {
              setDemandCreateOpen(false)
              navigate(ROUTES.demand(record.id))
            },
          })
        }}
        journalists={journalists}
        journalistsLoading={journalistsLoading}
        initialJournalistId={id}
      />
    </main>
  )
}
