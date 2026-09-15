import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, ConfirmDialog, DataTable, DatePicker, Heading, Icon as DsIcon, ICONS, Pagination, SelectField, TableRowActions, Tabs, TabsList, TabsTrigger, Text, TextInput, type BadgeTone, type TableColumnDef } from '@print/ui'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useDemands, type DemandListItem } from '@/application/modules/Demand/hooks/use-demands'
import { useLocalDemandActions } from '@/application/modules/Demand/hooks/use-local-demand-actions'
import { useJournalists } from '@/application/modules/Journalist/hooks/use-journalists'
import { useDemandFilters } from '@/application/modules/Demand/stores/demand.store'
import {
  demandListCode,
  demandListTitle,
  getDemandStatusFilterOptions,
  listAppliedDemandFilters,
  parseDemandStatusFilter,
  sanitizeDemandListStatus,
  toDemandCaptureRevision,
} from '@/application/modules/Demand/presentation/demand-list-filters'
import { collectDemandTags } from '@/application/modules/Demand/presentation/demand-tags'
import { ROUTES } from '@/ui/routes/paths'
import { Icon } from '@/ui/components/Icon'
import { DemandCreateDrawer } from '../components/DemandCreateDrawer'
import styles from '@/ui/styles/design.module.scss'

const statusLabels: Record<string, string> = {
  in_progress: 'Em andamento',
  sent: 'Enviada',
  closed_without_send: 'Encerrada sem envio',
}
const priorityLabels: Record<string, string> = { critical: 'P1 · Crítica', high: 'P1 · Alta', medium: 'P2 · Média', low: 'P3 · Baixa' }
const statusTones: Record<string, BadgeTone> = { in_progress: 'soft', sent: 'primary', closed_without_send: 'neutral' }
const DEMANDS_PAGE_SIZE = 4
const responsibleOptions = [
  { value: 'all', label: 'Toda a equipe' },
  { value: 'r-ana', label: 'Ana Paula' },
  { value: 'r-bruno', label: 'Bruno Costa' },
  { value: 'r-ricardo', label: 'Ricardo M.' },
  { value: 'r-mariana', label: 'Mariana S.' },
]
type DemandLifecycle = 'active' | 'history'

function isLocalDemand(demand: DemandListItem): demand is Extract<DemandListItem, { kind: 'local' }> {
  return 'kind' in demand
}

function deadlineLabel(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(value)
}

function formatFilterDeadline(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export function DemandsPage() {
  const pageState = useDemandFilters((state) => state.page)
  const setPage = useDemandFilters((state) => state.setPage)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { capture, revise, remove } = useLocalDemandActions()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editing, setEditing] = useState<DemandListItem | null>(null)
  const [deleting, setDeleting] = useState<DemandListItem | null>(null)
  const search = searchParams.get('q') ?? ''
  const lifecycle: DemandLifecycle = searchParams.get('lifecycle') === 'history' ? 'history' : 'active'
  const status = sanitizeDemandListStatus(parseDemandStatusFilter(searchParams.get('status')), lifecycle)
  const responsibleId = searchParams.get('responsible') ?? 'all'
  const deadlineOn = searchParams.get('deadline') ?? ''
  const statusOptions = getDemandStatusFilterOptions(lifecycle)
  const editingCapture = useMemo(() => (editing ? toDemandCaptureRevision(editing) : undefined), [editing])

  const setUrlFilter = (key: string, value: string, defaultValue = '') => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (value === defaultValue) next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
    setPage(1)
  }

  const setLifecycle = (value: string) => {
    const nextLifecycle: DemandLifecycle = value === 'history' ? 'history' : 'active'
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextLifecycle === 'active') next.delete('lifecycle')
      else next.set('lifecycle', nextLifecycle)
      const sanitized = sanitizeDemandListStatus(parseDemandStatusFilter(next.get('status')), nextLifecycle)
      if (sanitized === 'all') next.delete('status')
      else next.set('status', sanitized)
      return next
    }, { replace: true })
    setPage(1)
  }

  const clearFilters = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const key of ['q', 'status', 'responsible', 'deadline']) next.delete(key)
      return next
    }, { replace: true })
    setPage(1)
  }

  useEffect(() => {
    const rawStatus = searchParams.get('status')
    if (!rawStatus) return
    if (status === 'all') {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.delete('status')
        return next
      }, { replace: true })
      return
    }
    if (rawStatus !== status) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.set('status', status)
        return next
      }, { replace: true })
    }
  }, [searchParams, status, setSearchParams])

  const { data, activeCount, historyCount, isLoading } = useDemands({
    search,
    status,
    responsibleId,
    lifecycle,
    deadlineOn: deadlineOn || undefined,
  })
  const { data: journalists, isLoading: journalistsLoading } = useJournalists()
  const tagSuggestions = collectDemandTags(data)
  const pageCount = Math.max(1, Math.ceil(data.length / DEMANDS_PAGE_SIZE))
  const page = Math.min(pageState, pageCount)
  const pagedData = data.slice((page - 1) * DEMANDS_PAGE_SIZE, page * DEMANDS_PAGE_SIZE)
  const hasActiveFilters = Boolean(search || status !== 'all' || responsibleId !== 'all' || deadlineOn)
  const appliedFilters = listAppliedDemandFilters({
    search,
    status,
    statusLabel: statusOptions.find((option) => option.value === status)?.label ?? status,
    responsibleId,
    responsibleLabel: responsibleOptions.find((option) => option.value === responsibleId)?.label ?? responsibleId,
    deadlineOn,
    deadlineLabel: formatFilterDeadline(deadlineOn),
  })

  useEffect(() => {
    if (pageState !== page) setPage(page)
  }, [page, pageState, setPage])

  const columns = useMemo<TableColumnDef<DemandListItem>[]>(() => [
    { id: 'demand', header: 'Caso / fonte', priority: { desktop: 1, tablet: 1, mobile: 1 }, size: 'fill', cell: (demand) => <span className={styles.demandTitle}><Link to={ROUTES.demand(demand.id)}>{isLocalDemand(demand) ? demand.subject : demand.title}</Link><small>{isLocalDemand(demand) ? `${demand.contactName} · ${demand.contactOutlet} · #${demand.code} · Registro local` : `${demand.journalistName} · #${demand.code}`}</small></span> },
    { id: 'status', header: 'Status', priority: { desktop: 2, tablet: 2, mobile: 3 }, size: 'sm', cell: (demand) => <Badge size="sm" tone={statusTones[demand.status] ?? 'neutral'}>{statusLabels[demand.status] ?? demand.status}</Badge> },
    { id: 'deadline', header: 'Prazo', priority: { desktop: 3, tablet: 3, mobile: 2 }, size: 'md', cell: (demand) => <span className={styles.deadline}><Icon name="calendar" />{isLocalDemand(demand) ? demand.requestedDeadline : deadlineLabel(demand.deadlineAt)}</span> },
    { id: 'responsible', header: 'Responsável', priority: { desktop: 4, tablet: 4, mobile: 4 }, size: 'md', cellType: 'personDetailed', cell: (demand) => ({ name: demand.responsibleName }) },
    { id: 'priority', header: 'Prioridade', priority: { desktop: 5, tablet: 5, mobile: 5 }, size: 'sm', cell: (demand) => <span className={styles.priority}>{demand.priority ? priorityLabels[demand.priority] : 'Ainda não definida'}</span> },
  ], [])

  return (
    <div className={styles.page}>
      <header className={styles.pageHeading}>
        <div>
          <Text as="p" variant="labelSm" tone="primary" className={styles.eyebrow}>Central de atendimento à imprensa</Text>
          <Heading level={1} className={styles.pageTitle}>Todas as demandas</Heading>
          <Text tone="muted">Registre, consulte e recupere casos de imprensa em um só lugar.</Text>
        </div>
        <section className={styles.createFeature} aria-label="Nova demanda">
        <Card variant="action" padding="lg" className={styles.createCard} data-layout="horizontal" data-width="wide">
          <div className={styles.createContent}>
            <div className={styles.createIcon} data-create-icon aria-hidden="true"><DsIcon src={ICONS.home.addCircle} size={24} /></div>
            <div className={styles.createCopy}>
              <Heading level={3} variant="sm" data-typography="compact">Nova demanda</Heading>
              <Text variant="labelMd">Registre a entrada e mantenha o contexto.</Text>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(true)}>
            Começar
            <DsIcon src={ICONS.home.arrowForward} size={18} aria-hidden="true" />
          </Button>
        </Card>
        </section>
      </header>

      <Tabs className={styles.tabsDs} variant="underline" value={lifecycle} onValueChange={setLifecycle}>
        <TabsList aria-label="Ciclo das demandas">
          <TabsTrigger value="active">Demandas ativas <Badge size="sm" tone="soft">{activeCount}</Badge></TabsTrigger>
          <TabsTrigger value="history">Histórico <Badge size="sm" tone="neutral">{historyCount}</Badge></TabsTrigger>
        </TabsList>
      </Tabs>

      <section className={styles.filters} aria-label="Filtros de demandas">
        <TextInput label="Busca por texto" labelSize="sm" name="search" size="sm" value={search} onChange={(event) => setUrlFilter('q', event.target.value)} placeholder="Pesquisar título, jornalista ou ID…" />
        <SelectField label="Status" labelSize="sm" name="status" size="sm" value={status} onValueChange={(value) => setUrlFilter('status', value, 'all')} options={statusOptions} />
        <SelectField label="Responsável" labelSize="sm" name="responsible" size="sm" value={responsibleId} onValueChange={(value) => setUrlFilter('responsible', value, 'all')} options={responsibleOptions} />
        <DatePicker label="Prazo" labelSize="sm" name="deadline" size="sm" value={deadlineOn} onValueChange={(value) => setUrlFilter('deadline', value)} hideHint />
        <Button type="button" variant="secondary" size="sm" aria-label="Limpar filtros" disabled={!hasActiveFilters} onClick={clearFilters}>
          <DsIcon src={ICONS.ui.filter} size={16} />
          Limpar
        </Button>
      </section>

      {appliedFilters.length > 0 ? (
        <section className={styles.appliedFilters} aria-label="Filtros aplicados">
          <Text as="p" variant="labelSm" tone="muted">Filtros aplicados</Text>
          <ul>
            {appliedFilters.map((filter) => (
              <li key={filter.key}><Badge size="sm" tone="soft">{filter.label}</Badge></li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.tableShell} aria-busy={isLoading}>
        <DataTable
          columns={columns}
          data={pagedData}
          getRowKey={(demand) => demand.id}
          emptyState="Nenhuma demanda encontrada. Ajuste ou limpe os filtros para ver outros resultados."
          rowActions={(demand) => (
            <TableRowActions
              aria-label={`Ações de ${demandListTitle(demand)}`}
              actions={[
                { label: 'Abrir', icon: 'view', onSelect: () => navigate(ROUTES.demand(demand.id)) },
                { label: 'Editar', icon: 'edit', onSelect: () => setEditing(demand) },
                { label: 'Excluir', icon: 'delete', destructive: true, onSelect: () => setDeleting(demand) },
              ]}
            />
          )}
        />
      </section>
      <Pagination className={styles.pagination} aria-label="Paginação das demandas" page={page} pageSize={DEMANDS_PAGE_SIZE} totalItems={data.length} onPageChange={setPage} />
      <DemandCreateDrawer
        open={isCreateOpen || Boolean(editing)}
        mode={editing ? 'edit' : 'create'}
        initialCapture={editingCapture}
        onOpenChange={(open) => {
          if (open) return
          setIsCreateOpen(false)
          setEditing(null)
        }}
        onCapture={(nextCapture) => {
          if (editing) {
            revise(editing, nextCapture)
            return
          }
          capture(nextCapture, {
            onSuccess: (record) => {
              setIsCreateOpen(false)
              navigate(ROUTES.demand(record.id))
            },
          })
        }}
        journalists={journalists}
        journalistsLoading={journalistsLoading}
        tagSuggestions={tagSuggestions}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Excluir demanda?"
        description={deleting ? `A demanda “${demandListTitle(deleting)}” (#${demandListCode(deleting)}) será removida desta listagem.` : undefined}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => {
          if (!deleting) return
          remove(deleting.id, { onSuccess: () => setDeleting(null) })
        }}
      />
    </div>
  )
}
