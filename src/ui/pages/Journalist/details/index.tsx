import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Badge,
  Button,
  Card,
  DrawerShell,
  EmptyState,
  Heading,
  Rating,
  Stat,
  Text,
} from "@print/ui";

import { useJournalist } from "@/application/modules/Journalist/hooks/use-journalist";
import {
  getJournalistDemandStatusLabel,
  type JournalistCaseOutcomeView,
} from "@/application/modules/Journalist/presentation/journalist-profile.viewmodel";
import type {
  JournalistDemandHistoryItem,
  RelationshipEvaluation,
} from "@/domain/Journalist/journalist.entity";
import { useUpdateJournalist } from "@/application/modules/Journalist/hooks/use-update-journalist";
import { useJournalists } from "@/application/modules/Journalist/hooks/use-journalists";
import { useLocalDemandActions } from "@/application/modules/Demand/hooks/use-local-demand-actions";
import { useRegisterDemandOutcome } from "@/application/modules/Demand/hooks/use-register-demand-outcome";
import { formatPercent, formatScore } from "@/shared/format";
import { ROUTES } from "@/ui/routes/paths";
import { Icon } from "@/ui/components/Icon";
import { DemandCreateDrawer } from "@/ui/pages/Demand/components/DemandCreateDrawer";
import { DemandOutcomeDrawer } from "@/ui/pages/Demand/components/DemandOutcomeDrawer";
import { JournalistCreateDrawer } from "../components/JournalistCreateDrawer";
import styles from "@/ui/styles/design.module.scss";

const LIST_PREVIEW_LIMIT = 3;

function shortDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function recordedDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}


type EvaluationEntry =
  | {
      kind: "case";
      key: string;
      recordedAt: Date;
      item: JournalistCaseOutcomeView;
    }
  | {
      kind: "relationship";
      key: string;
      recordedAt: Date;
      item: RelationshipEvaluation;
    };

function HistoryList({ items }: { items: JournalistDemandHistoryItem[] }) {
  return (
    <div className={styles.historyPanel}>
      {items.map((item) => (
        <Link key={item.demandId} to={ROUTES.demand(item.demandId)}>
          <i />
          <span>
            <small>{item.kindLabel}</small>
            <strong>{item.title}</strong>
            <em>
              {getJournalistDemandStatusLabel(item.status)}
              {item.outcomeLabel ? ` · ${item.outcomeLabel}` : ""}
            </em>
          </span>
          <time dateTime={item.occurredAt.toISOString()}>
            {shortDate(item.occurredAt)}
          </time>
        </Link>
      ))}
    </div>
  );
}

function EvaluationCard({ entry }: { entry: EvaluationEntry }) {
  if (entry.kind === "case") {
    return (
      <article className={styles.behaviorPanel}>
        <Text
          as="p"
          variant="labelSm"
          tone="muted"
          className={styles.evaluationDisclaimer}
        >
          Registro datado — não é fato inferido pelo sistema.
        </Text>
        <div className={styles.behaviorTop}>
          <span>
            <small>Tom da matéria</small>
            <strong>{entry.item.toneScore}/5</strong>
          </span>
          <span>
            <small>Publicado</small>
            <strong>{entry.item.publishedLabel}</strong>
          </span>
        </div>
        <div className={styles.behaviorTop}>
          {entry.item.usageScore != null ? (
            <span>
              <small>Aproveitamento</small>
              <strong>{entry.item.usageScore}/5</strong>
            </span>
          ) : null}
          <span>
            <small>Nota da pauta</small>
            <strong>{entry.item.caseScoreLabel} / 5</strong>
          </span>
        </div>
        <p>
          <small>Pauta</small> <strong>{entry.item.demandTitle}</strong>
        </p>
        {entry.item.resultSummary ? (
          <p>{entry.item.resultSummary}</p>
        ) : (
          <p>Sem observações adicionais.</p>
        )}
        <footer>
          Registrada por <strong>{entry.item.recordedBy}</strong> em{" "}
          <time dateTime={entry.item.recordedAt.toISOString()}>
            {recordedDate(entry.item.recordedAt)}
          </time>
          {" · "}
          <Link to={ROUTES.demand(entry.item.demandId)}>Ver demanda</Link>
        </footer>
      </article>
    );
  }

  return (
    <article className={styles.behaviorPanel}>
      <Text
        as="p"
        variant="labelSm"
        tone="muted"
        className={styles.evaluationDisclaimer}
      >
        Registro datado — não é fato inferido pelo sistema.
      </Text>
      <div className={styles.behaviorTop}>
        <span>
          <small>Tom editorial registrado</small>
          <strong>{entry.item.editorialToneLabel}</strong>
        </span>
        <span>
          <small>Nota de relacionamento</small>
          <strong>{formatScore(entry.item.score)} / 5</strong>
        </span>
      </div>
      <div className={styles.traits}>
        {entry.item.traits.map((trait) => (
          <span key={trait}>{trait}</span>
        ))}
      </div>
      {entry.item.notes ? <p>{entry.item.notes}</p> : <p>Sem observações adicionais.</p>}
      <footer>
        Registrada por <strong>{entry.item.authorName}</strong> em{" "}
        <time dateTime={entry.item.recordedAt.toISOString()}>
          {recordedDate(entry.item.recordedAt)}
        </time>
      </footer>
    </article>
  );
}

function BackToJournalists() {
  return (
    <Link className={styles.backLink} to={ROUTES.journalists}>
      <Icon name="arrow-left" />
      Voltar para jornalistas
    </Link>
  );
}

export function JournalistPage() {
  const { journalistId } = useParams();
  const id = journalistId ?? "";
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [demandCreateOpen, setDemandCreateOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [evaluationsDrawerOpen, setEvaluationsDrawerOpen] = useState(false);
  const { data: journalist, isLoading } = useJournalist(journalistId);
  const { data: journalists, isLoading: journalistsLoading } = useJournalists();
  const { capture } = useLocalDemandActions();
  const updateMutation = useUpdateJournalist(id, {
    onSuccess: () => setEditOpen(false),
  });
  const outcomeMutation = useRegisterDemandOutcome("", {
    onSuccess: () => setEvaluationOpen(false),
  });

  if (isLoading)
    return (
      <main className={`${styles.page} ${styles.journalistPage}`}>
        <BackToJournalists />
        <div className={styles.statePage}>
          <Text tone="muted">Carregando perfil…</Text>
        </div>
      </main>
    );
  if (!journalist)
    return (
      <main className={`${styles.page} ${styles.journalistPage}`}>
        <BackToJournalists />
        <div className={styles.statePage}>
          <EmptyState
            variant="empty"
            title="Jornalista não encontrado"
            description="Selecione outro perfil."
          />
        </div>
      </main>
    );
  const roundedRelationshipScore =
    journalist.relationshipScore == null
      ? null
      : Math.max(1, Math.min(5, Math.round(journalist.relationshipScore)));
  const evaluableDemands = journalist.demandHistory.filter(
    (item) => item.status === "sent" || item.status === "closed_without_send",
  );
  const demandOptions = evaluableDemands.map((item) => ({
    value: item.demandId,
    label: item.title,
  }));
  const visibleHistory = journalist.demandHistory.slice(0, LIST_PREVIEW_LIMIT);
  const evaluationEntries: EvaluationEntry[] = [
    ...journalist.caseOutcomes.map((item) => ({
      kind: "case" as const,
      key: `case-${item.demandId}`,
      recordedAt: item.recordedAt,
      item,
    })),
    ...journalist.relationshipEvaluations.map((item) => ({
      kind: "relationship" as const,
      key: item.id,
      recordedAt: item.recordedAt,
      item,
    })),
  ].sort((left, right) => right.recordedAt.getTime() - left.recordedAt.getTime());
  const visibleEvaluations = evaluationEntries.slice(0, LIST_PREVIEW_LIMIT);
  const hasMoreHistory = journalist.demandHistory.length > LIST_PREVIEW_LIMIT;
  const hasMoreEvaluations = evaluationEntries.length > LIST_PREVIEW_LIMIT;

  return (
    <main className={`${styles.page} ${styles.journalistPage}`}>
      <BackToJournalists />

      <section className={styles.profileHero}>
        <Avatar
          name={journalist.name}
          src={
            journalist.id === "j-carolina"
              ? "/images/carolina-montenegro.png"
              : undefined
          }
          size="lg"
          className={styles.profileAvatar}
        />
        <div className={styles.profileIdentity}>
          <Badge tone={journalist.isActive ? "success" : "neutral"} size="sm">
            {journalist.isActive ? "Ativa" : "Inativa"}
          </Badge>
          <Heading level={1} variant="lg">
            {journalist.name}
          </Heading>
          <Text tone="muted">
            {journalist.roleTitle} · {journalist.outletName}
          </Text>
          <div>
            <Badge tone="outline">{journalist.desk}</Badge>
          </div>
        </div>
        <div className={styles.headingActions}>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              updateMutation.reset();
              setEditOpen(true);
            }}
          >
            Editar perfil
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setDemandCreateOpen(true)}
          >
            <Icon name="plus" />
            Nova demanda
          </Button>
        </div>
      </section>

      <section aria-label="Dados objetivos do jornalista">
        <section className={styles.metricsGrid}>
          <Card variant="surface" padding="lg" className={styles.metric}>
            <Stat
              label="Total de demandas"
              value={String(journalist.objectiveStats.totalDemands)}
            />
            <small>
              {journalist.objectiveStats.solicitedCount} solicitadas ·{" "}
              {journalist.objectiveStats.proactiveCount} proativas
            </small>
          </Card>

          <Card variant="surface" padding="lg" className={styles.metric}>
            <Stat
              label="Uso de posicionamento"
              value={formatPercent(
                journalist.objectiveStats.positioningUsageRate,
              )}
            />
            <div className={styles.progress}>
              <i
                style={{
                  width: formatPercent(
                    journalist.objectiveStats.positioningUsageRate,
                  ),
                }}
              />
            </div>
            <small>Frequência alta</small>
          </Card>
          <Card
            variant="surface"
            padding="lg"
            className={styles.metric}
            data-testid="journalist-relationship-score"
          >
            <Stat
              label="Nota de relacionamento"
              value={
                journalist.relationshipScoreLabel
                  ? `${journalist.relationshipScoreLabel} / 5`
                  : "—"
              }
            />
            {roundedRelationshipScore != null ? (
              <Rating
                label="Nota de relacionamento"
                labelHidden
                readOnly
                size="sm"
                value={roundedRelationshipScore}
              />
            ) : (
              <small>Sem avaliações ainda</small>
            )}
          </Card>
          <Card variant="surface" padding="lg" className={styles.contact}>
            <div>
              <Text as="span" variant="labelSm" tone="muted">
                Informações de contato
              </Text>
              {journalist.email ? (
                <a href={`mailto:${journalist.email}`}>
                  <Icon name="mail" />
                  <b>
                    {journalist.preferredChannel === "email"
                      ? "E-mail preferencial"
                      : "E-mail corporativo"}
                  </b>
                  {journalist.email}
                </a>
              ) : (
                <span
                  className={styles.contactUnavailable}
                  aria-label="E-mail não informado"
                >
                  <Icon name="mail" />
                  <b>E-mail</b>Não informado
                </span>
              )}
              {journalist.phone ? (
                <a href={`tel:${journalist.phone}`}>
                  <Icon name="phone" />
                  <b>
                    {journalist.preferredChannel === "whatsapp"
                      ? "WhatsApp preferencial"
                      : journalist.preferredChannel === "phone"
                        ? "Telefone preferencial"
                        : "Telefone"}
                  </b>
                  {journalist.phone}
                </a>
              ) : (
                <span
                  className={styles.contactUnavailable}
                  aria-label="Telefone não informado"
                >
                  <Icon name="phone" />
                  <b>Telefone</b>Não informado
                </span>
              )}
            </div>
          </Card>
        </section>

        <section className={styles.coverageSection}>
          <h2>Foco de cobertura</h2>
          <div className={styles.coveragePanel}>
            <div className={styles.topicList}>
              {journalist.topics.map((topic, index) => (
                <span
                  className={index < 3 ? styles.topicStrong : ""}
                  key={topic}
                >
                  {topic}
                </span>
              ))}
            </div>
            <div className={styles.contactWindow}>
              <Icon name="clock" />
              <span>
                <small>Melhor horário para contato</small>
                {journalist.bestContactWindow || "Não informado"}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.historySection}>
          <h2>Histórico recente</h2>
          <HistoryList items={visibleHistory} />
          {hasMoreHistory ? (
            <div className={styles.listReveal}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setHistoryDrawerOpen(true)}
              >
                Ver todo o histórico
              </Button>
            </div>
          ) : null}
        </section>
      </section>

      <section
        className={styles.evaluationSection}
        aria-label="Avaliações registradas"
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2>Avaliações registradas</h2>
            <Text tone="muted" variant="labelSm">
              Resultados de pauta registrados manualmente, ligados a cada demanda.
            </Text>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={demandOptions.length === 0}
            onClick={() => {
              outcomeMutation.reset();
              setEvaluationOpen(true);
            }}
          >
            Avaliar resultado
          </Button>
        </div>
        {evaluationEntries.length ? (
          <>
            <div className={styles.evaluationList}>
              {visibleEvaluations.map((entry) => (
                <EvaluationCard key={entry.key} entry={entry} />
              ))}
            </div>
            {hasMoreEvaluations ? (
              <div className={styles.listReveal}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEvaluationsDrawerOpen(true)}
                >
                  Ver todas as avaliações
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className={styles.behaviorPanel}>
            <EmptyState
              variant="empty"
              title="Nenhuma avaliação registrada"
              description="Avalie o resultado de uma pauta enviada ou encerrada; o registro aparece aqui ligado ao caso."
            />
          </div>
        )}
      </section>

      <DrawerShell
        open={historyDrawerOpen}
        onOpenChange={setHistoryDrawerOpen}
        title="Histórico recente"
        description={`${journalist.demandHistory.length} demandas vinculadas a este perfil.`}
        size="lg"
        contentLayout="scroll"
        presentation="layer"
        origin="end"
        responsiveOrigin="bottom"
        closeLabel="Fechar histórico"
      >
        <HistoryList items={journalist.demandHistory} />
      </DrawerShell>
      <DrawerShell
        open={evaluationsDrawerOpen}
        onOpenChange={setEvaluationsDrawerOpen}
        title="Avaliações registradas"
        description={`${evaluationEntries.length} registros manuais ligados a este perfil.`}
        size="lg"
        contentLayout="scroll"
        presentation="layer"
        origin="end"
        responsiveOrigin="bottom"
        closeLabel="Fechar avaliações"
      >
        <div className={styles.evaluationList}>
          {evaluationEntries.map((entry) => (
            <EvaluationCard key={entry.key} entry={entry} />
          ))}
        </div>
      </DrawerShell>
      <JournalistCreateDrawer
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        onCreate={() => undefined}
        onSave={updateMutation.update}
        initialProfile={journalist}
        topicSuggestions={journalist.topics}
        isPending={updateMutation.isPending}
        error={updateMutation.error}
      />
      <DemandOutcomeDrawer
        open={evaluationOpen}
        onOpenChange={setEvaluationOpen}
        onRegister={outcomeMutation.register}
        demandOptions={demandOptions}
        resolveInitialValues={(demandId) => {
          const outcome = journalist.caseOutcomes.find((item) => item.demandId === demandId);
          if (!outcome) return null;
          return {
            toneScore: outcome.toneScore,
            published: outcome.published,
            usageScore: outcome.usageScore,
            resultSummary: outcome.resultSummary,
            demandId,
          };
        }}
        hasJournalistLink
        isPending={outcomeMutation.isPending}
        error={outcomeMutation.error}
      />
      <DemandCreateDrawer
        open={demandCreateOpen}
        onOpenChange={setDemandCreateOpen}
        onCapture={(input) => {
          capture(input, {
            onSuccess: (record) => {
              setDemandCreateOpen(false);
              navigate(ROUTES.demand(record.id));
            },
          });
        }}
        journalists={journalists}
        journalistsLoading={journalistsLoading}
        initialJournalistId={id}
      />
    </main>
  );
}
