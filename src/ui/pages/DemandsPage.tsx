import { useMemo, useState } from 'react'
import { Badge, Button, Card, DataTable, DatePicker, Heading, Icon as DsIcon, ICONS, Pagination, SelectField, Tabs, TabsList, TabsTrigger, Text, TextInput, type BadgeTone, type TableColumnDef } from '@print/ui'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useDemands, type DemandListItem } from '@/application/modules/Demand/hooks/use-demands'
import { useJournalists } from '@/application/modules/Journalist/hooks/use-journalists'
import { useDemandFilters } from '@/application/modules/Demand/stores/demand.store'
import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'
import { ROUTES } from '@/ui/routes/paths'
import { Icon } from '@/ui/components/Icon'
import { DemandCreateDrawer } from './DemandCreateDrawer'
import styles from '@/ui/styles/design.module.scss'

const statusLabels: Record<string, string> = {
  draft: 'Rascunho', in_progress: 'Em andamento', pending_review: 'Em review',
  changes_requested: 'Ajustes', approved: 'Aprovada', sent: 'Enviada',
  closed_without_send: 'Encerrada sem envio',
}
const priorityLabels: Record<string, string> = { critical: 'P1 · Crítica', high: 'P1 · Alta', medium: 'P2 · Média', low: 'P3 · Baixa' }
const statusTones: Record<string, BadgeTone> = { draft: 'neutral', in_progress: 'soft', pending_review: 'warning', changes_requested: 'danger', approved: 'success', sent: 'primary', closed_without_send: 'neutral' }
const DEMANDS_PAGE_SIZE = 4
const demandStatusValues = ['all', 'draft', 'in_progress', 'pending_review', 'changes_requested', 'approved', 'sent', 'closed_without_send'] as const
type DemandStatusFilter = (typeof demandStatusValues)[number]
type DemandLifecycle = 'active' | 'history'

function asStatusFilter(value: string | null): DemandStatusFilter {
  return demandStatusValues.includes(value as DemandStatusFilter) ? value as DemandStatusFilter : 'all'
}

type DemandRow = DemandListItem
function isLocalDemand(demand: DemandRow): demand is Extract<DemandRow, { kind: 'local' }> {
  return 'kind' in demand
}

function deadlineLabel(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(value)
}

export function DemandsPage() {
  const filters = useDemandFilters()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const addLocalDemand = useLocalDemandStore((state) => state.add)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const search = searchParams.get('q') ?? ''
  const status = asStatusFilter(searchParams.get('status'))
  const responsibleId = searchParams.get('responsible') ?? 'all'
  const deadlineOn = searchParams.get('deadline') ?? ''
  const lifecycle: DemandLifecycle = searchParams.get('lifecycle') === 'history' ? 'history' : 'active'

  const setUrlFilter = (key: string, value: string, defaultValue = '') => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (value === defaultValue) next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
    filters.setPage(1)
  }

  const clearFilters = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const key of ['q', 'status', 'responsible', 'deadline']) next.delete(key)
      return next
    }, { replace: true })
    filters.setPage(1)
  }

  const { data, activeCount, historyCount, isLoading } = useDemands({
    search,
    status,
    responsibleId,
    lifecycle,
    deadlineOn: deadlineOn || undefined,
  })
  const { data: journalists, isLoading: journalistsLoading } = useJournalists()
  const pageCount = Math.max(1, Math.ceil(data.length / DEMANDS_PAGE_SIZE))
  const page = Math.min(filters.page, pageCount)
  const pagedData = data.slice((page - 1) * DEMANDS_PAGE_SIZE, page * DEMANDS_PAGE_SIZE)
  const hasActiveFilters = Boolean(search || status !== 'all' || responsibleId !== 'all' || deadlineOn)
  const columns = useMemo<TableColumnDef<DemandRow>[]>(() => [
    { id: 'demand', header: 'Caso / fonte', priority: { desktop: 1, tablet: 1, mobile: 1 }, size: 'fill', cell: (demand) => <span className={styles.demandTitle}><Link to={ROUTES.demand(demand.id)}>{isLocalDemand(demand) ? demand.subject : demand.title}</Link><small>{isLocalDemand(demand) ? `${demand.contactName} · ${demand.contactOutlet} · #${demand.code} · Registro local` : `${demand.journalistName} · #${demand.code}`}</small></span> },
    { id: 'status', header: 'Status', priority: { desktop: 2, tablet: 2, mobile: 3 }, size: 'sm', cell: (demand) => <Badge size="sm" tone={statusTones[demand.status] ?? 'neutral'}>{statusLabels[demand.status] ?? demand.status}</Badge> },
    { id: 'deadline', header: 'Prazo', priority: { desktop: 3, tablet: 3, mobile: 2 }, size: 'md', cell: (demand) => <span className={styles.deadline}><Icon name="calendar" />{isLocalDemand(demand) ? demand.requestedDeadline : deadlineLabel(demand.deadlineAt)}</span> },
    { id: 'responsible', header: 'Responsável', priority: { desktop: 4, tablet: 4, mobile: 4 }, size: 'md', cellType: 'personDetailed', cell: (demand) => ({ name: demand.responsibleName, subtitle: demand.responsibleId ? `ID de atribuição · ${demand.responsibleId}` : 'Enriquecimento pendente' }) },
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

      <section className={styles.filters} aria-label="Filtros de demandas">
        <TextInput label="Busca por texto" labelSize="sm" name="search" size="sm" value={search} onChange={(event) => setUrlFilter('q', event.target.value)} placeholder="Pesquisar título, jornalista ou ID…" />
        <SelectField label="Status" labelSize="sm" name="status" size="sm" value={status} onValueChange={(value) => setUrlFilter('status', value, 'all')} options={[{value:'all',label:'Todos os status'},{value:'draft',label:'Rascunho'},{value:'in_progress',label:'Em andamento'},{value:'pending_review',label:'Em review'},{value:'changes_requested',label:'Ajustes solicitados'},{value:'approved',label:'Aprovada'},{value:'sent',label:'Enviada'},{value:'closed_without_send',label:'Encerrada sem envio'}]} />
        <SelectField label="Responsável" labelSize="sm" name="responsible" size="sm" value={responsibleId} onValueChange={(value) => setUrlFilter('responsible', value, 'all')} options={[{value:'all',label:'Toda a equipe'},{value:'r-ana',label:'Ana Paula'},{value:'r-bruno',label:'Bruno Costa'},{value:'r-ricardo',label:'Ricardo M.'},{value:'r-mariana',label:'Mariana S.'}]} />
        <DatePicker label="Prazo" labelSize="sm" name="deadline" size="sm" value={deadlineOn} onValueChange={(value) => setUrlFilter('deadline', value)} hideHint />
        {hasActiveFilters ? <Button type="button" variant="secondary" size="sm" aria-label="Limpar filtros" onClick={clearFilters}><DsIcon src={ICONS.ui.filter} size={16} />Limpar</Button> : null}
      </section>

      <Tabs className={styles.tabsDs} variant="underline" value={lifecycle} onValueChange={(value) => setUrlFilter('lifecycle', value, 'active')}><TabsList aria-label="Ciclo das demandas"><TabsTrigger value="active">Demandas ativas <Badge size="sm" tone="soft">{activeCount}</Badge></TabsTrigger><TabsTrigger value="history">Histórico <Badge size="sm" tone="neutral">{historyCount}</Badge></TabsTrigger></TabsList></Tabs>

      {lifecycle === 'history' ? (
        <section className={styles.historyFilters} aria-label="Filtros do histórico">
          <Text as="span" variant="labelSm" tone="muted">Mostrar</Text>
          <Button type="button" size="sm" variant={status === 'all' ? 'primary' : 'secondary'} onClick={() => setUrlFilter('status', 'all', 'all')}>Todo o histórico</Button>
          <Button type="button" size="sm" variant={status === 'sent' ? 'primary' : 'secondary'} onClick={() => setUrlFilter('status', 'sent', 'all')}>Enviadas</Button>
          <Button type="button" size="sm" variant={status === 'closed_without_send' ? 'primary' : 'secondary'} onClick={() => setUrlFilter('status', 'closed_without_send', 'all')}>Encerradas sem envio</Button>
        </section>
      ) : null}

      <section className={styles.tableShell} aria-busy={isLoading}>
        <DataTable columns={columns} data={pagedData} getRowKey={(demand) => demand.id} emptyState="Nenhuma demanda encontrada. Ajuste ou limpe os filtros para ver outros resultados." rowActions={(demand) => <Button type="button" variant="ghost" size="sm" onClick={() => navigate(ROUTES.demand(demand.id))}>Abrir</Button>} />
      </section>
      <Pagination className={styles.pagination} aria-label="Paginação das demandas" page={page} pageSize={DEMANDS_PAGE_SIZE} totalItems={data.length} onPageChange={filters.setPage} />
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
