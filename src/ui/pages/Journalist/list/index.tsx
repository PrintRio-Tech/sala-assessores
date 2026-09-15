import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Heading,
  Icon,
  ICONS,
  Pagination,
  SectionState,
  SelectField,
  Text,
  TextInput,
  type TableColumnDef,
} from '@print/ui'
import { Link, useNavigate } from 'react-router-dom'

import { useJournalists, type JournalistFilters } from '@/application/modules/Journalist/hooks/use-journalists'
import { useCreateJournalist } from '@/application/modules/Journalist/hooks/use-create-journalist'
import { ROUTES } from '@/ui/routes/paths'
import { JournalistCreateDrawer } from './JournalistCreateDrawer'
import styles from '@/ui/styles/design.module.scss'

const channelLabels = {
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  phone: 'Telefone',
} as const

const JOURNALISTS_PAGE_SIZE = 5
const ALL_FILTERS = 'all'

interface JournalistUiFilters {
  search: string
  outletName: string
  desk: string
  roleTitle: string
  status: string
  preferredChannel: string
  topic: string
}

const initialFilters: JournalistUiFilters = {
  search: '',
  outletName: ALL_FILTERS,
  desk: ALL_FILTERS,
  roleTitle: ALL_FILTERS,
  status: ALL_FILTERS,
  preferredChannel: ALL_FILTERS,
  topic: ALL_FILTERS,
}

function toApplicationFilters(filters: JournalistUiFilters): JournalistFilters {
  return {
    search: filters.search,
    outletName: filters.outletName === ALL_FILTERS ? undefined : filters.outletName,
    desk: filters.desk === ALL_FILTERS ? undefined : filters.desk,
    roleTitle: filters.roleTitle === ALL_FILTERS ? undefined : filters.roleTitle,
    status: filters.status === ALL_FILTERS ? undefined : filters.status as JournalistFilters['status'],
    preferredChannel: filters.preferredChannel === ALL_FILTERS ? undefined : filters.preferredChannel as JournalistFilters['preferredChannel'],
    topic: filters.topic === ALL_FILTERS ? undefined : filters.topic,
  }
}

export function JournalistsPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<JournalistUiFilters>(initialFilters)
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const { data: allJournalists } = useJournalists()
  const { data, filterOptions, isLoading, error, reload } = useJournalists(toApplicationFilters(filters))
  const {
    create: createJournalist,
    isPending: createPending,
    error: createError,
    reset: resetCreate,
  } = useCreateJournalist({
    onSuccess: () => {
      setCreateDrawerOpen(false)
      setCurrentPage(1)
    },
  })
  type JournalistListItem = (typeof data)[number]

  const pageCount = Math.max(1, Math.ceil(data.length / JOURNALISTS_PAGE_SIZE))
  const page = Math.min(currentPage, pageCount)
  const pagedData = data.slice((page - 1) * JOURNALISTS_PAGE_SIZE, page * JOURNALISTS_PAGE_SIZE)
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => key === 'search' ? Boolean(value.trim()) : value !== ALL_FILTERS)

  function updateFilter<Key extends keyof JournalistUiFilters>(key: Key, value: JournalistUiFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }))
    setCurrentPage(1)
  }

  function clearFilters() {
    setFilters(initialFilters)
    setCurrentPage(1)
  }

  const columns = useMemo<TableColumnDef<JournalistListItem>[]>(() => [
    {
      id: 'journalist',
      header: 'Jornalista',
      priority: { desktop: 1, tablet: 1, mobile: 1 },
      size: 'fill',
      cell: (journalist) => (
        <span className={styles.journalistName}>
          <Link to={ROUTES.journalist(journalist.id)}>{journalist.name}</Link>
          <small>{journalist.email}</small>
        </span>
      ),
    },
    {
      id: 'work',
      header: 'Veículo / editoria / cargo',
      priority: { desktop: 2, tablet: 2, mobile: 2 },
      size: 'lg',
      cell: (journalist) => (
        <span className={styles.journalistWork}>
          <strong>{journalist.outletName} · {journalist.desk}</strong>
          <small>{journalist.roleTitle}</small>
        </span>
      ),
    },
    {
      id: 'contact',
      header: 'Canal / contato',
      priority: { desktop: 3, tablet: 4, mobile: 4 },
      size: 'lg',
      cell: (journalist) => (
        <span className={styles.journalistContact}>
          <strong>{channelLabels[journalist.preferredChannel]}</strong>
          <small>{journalist.preferredChannel === 'email' ? journalist.email : journalist.phone}</small>
        </span>
      ),
    },
    {
      id: 'volume',
      header: 'Demandas',
      priority: { desktop: 4, tablet: 3, mobile: 3 },
      size: 'sm',
      align: 'right',
      cell: (journalist) => <strong className={styles.journalistVolume}>{journalist.objectiveStats.totalDemands}</strong>,
    },
    {
      id: 'relationship',
      header: 'Relacionamento / status',
      priority: { desktop: 5, tablet: 5, mobile: 5 },
      size: 'md',
      cell: (journalist) => {
        const evaluationCount = journalist.relationshipEvaluations.length
        return (
          <span className={styles.journalistRelationship}>
            <Badge size="sm" tone={journalist.isActive ? 'success' : 'neutral'}>{journalist.isActive ? 'Ativa' : 'Inativa'}</Badge>
            <small>{evaluationCount === 0 ? 'Sem avaliação registrada' : `${evaluationCount} ${evaluationCount === 1 ? 'avaliação registrada' : 'avaliações registradas'}`}</small>
          </span>
        )
      },
    },
  ], [])

  const emptyMessage = hasActiveFilters
    ? 'Nenhum jornalista corresponde aos filtros.'
    : 'Nenhum jornalista cadastrado.'

  return (
    <div className={styles.page}>
      <header className={`${styles.pageHeading} ${styles.journalistsHeading}`}>
        <div>
          <Text as="p" variant="labelSm" tone="primary" className={styles.eyebrow}>Inteligência de imprensa</Text>
          <Heading level={1} className={styles.pageTitle}>Jornalistas</Heading>
          <Text tone="muted">Consulte contatos, contexto profissional e registros de relacionamento.</Text>
        </div>
        <section className={styles.createFeature} aria-label="Novo jornalista">
          <Card
            variant="action"
            padding="lg"
            className={`${styles.createCard} ${styles.journalistCreateCard}`}
            data-layout="horizontal"
            data-width="wide"
          >
            <div className={styles.createContent}>
              <div className={styles.createIcon} data-create-icon aria-hidden="true">
                <Icon src={ICONS.home.addCircle} size={24} />
              </div>
              <div className={styles.createCopy}>
                <Heading level={3} variant="sm" data-typography="compact">Novo jornalista</Heading>
                <Text variant="labelMd">Amplie e organize sua base de contatos.</Text>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={() => { resetCreate(); setCreateDrawerOpen(true) }}>
              Novo jornalista
              <Icon src={ICONS.home.arrowForward} size={18} aria-hidden="true" />
            </Button>
          </Card>
        </section>
      </header>

      <section className={styles.journalistFilters} aria-label="Filtros de jornalistas">
        <TextInput
          label="Buscar jornalistas"
          labelSize="sm"
          name="journalist-search"
          size="sm"
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
          placeholder="Nome, veículo, editoria, cargo ou e-mail…"
          autoComplete="off"
        />
        <SelectField
          label="Veículo"
          labelSize="sm"
          name="journalist-outlet"
          size="sm"
          value={filters.outletName}
          onValueChange={(value) => updateFilter('outletName', value)}
          options={[{ value: ALL_FILTERS, label: 'Todos os veículos' }, ...filterOptions.outletNames.map((value) => ({ value, label: value }))]}
        />
        <SelectField
          label="Editoria"
          labelSize="sm"
          name="journalist-desk"
          size="sm"
          value={filters.desk}
          onValueChange={(value) => updateFilter('desk', value)}
          options={[{ value: ALL_FILTERS, label: 'Todas as editorias' }, ...filterOptions.desks.map((value) => ({ value, label: value }))]}
        />
        <div className={styles.journalistFilterActions}>
          <Button type="button" variant="ghost" size="sm" disabled={!hasActiveFilters} onClick={clearFilters}>Limpar filtros</Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-expanded={advancedFiltersOpen}
            aria-controls="journalist-advanced-filters"
            onClick={() => setAdvancedFiltersOpen((open) => !open)}
          >
            <Icon src={ICONS.ui.filter} size={16} />
            {advancedFiltersOpen ? 'Menos filtros' : 'Mais filtros'}
          </Button>
        </div>
        {advancedFiltersOpen ? (
          <div
            className={styles.journalistAdvancedFilters}
            data-mobile-safe-area="bottom-navigation"
            id="journalist-advanced-filters"
          >
            <SelectField
              label="Cargo"
              labelSize="sm"
              name="journalist-role"
              size="sm"
              value={filters.roleTitle}
              onValueChange={(value) => updateFilter('roleTitle', value)}
              options={[{ value: ALL_FILTERS, label: 'Todos os cargos' }, ...filterOptions.roleTitles.map((value) => ({ value, label: value }))]}
            />
            <SelectField
              label="Status"
              labelSize="sm"
              name="journalist-status"
              size="sm"
              value={filters.status}
              onValueChange={(value) => updateFilter('status', value)}
              options={[{ value: ALL_FILTERS, label: 'Todos os status' }, { value: 'active', label: 'Ativos' }, { value: 'inactive', label: 'Inativos' }]}
            />
            <SelectField
              label="Canal preferencial"
              labelSize="sm"
              name="journalist-channel"
              size="sm"
              value={filters.preferredChannel}
              onValueChange={(value) => updateFilter('preferredChannel', value)}
              options={[{ value: ALL_FILTERS, label: 'Todos os canais' }, { value: 'email', label: 'E-mail' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'phone', label: 'Telefone' }]}
            />
            <SelectField
              label="Tema"
              labelSize="sm"
              name="journalist-topic"
              size="sm"
              value={filters.topic}
              onValueChange={(value) => updateFilter('topic', value)}
              options={[{ value: ALL_FILTERS, label: 'Todos os temas' }, ...filterOptions.topics.map((value) => ({ value, label: value }))]}
            />
          </div>
        ) : null}
      </section>

      {!isLoading && !error ? (
        <div className={styles.journalistResultSummary}>
          <Text as="p" tone={hasActiveFilters ? 'default' : 'muted'} variant="labelSm" className={styles.journalistResultCount} aria-live="polite">
            {data.length === 0 && hasActiveFilters ? 'Nenhum resultado para os filtros aplicados' : `${data.length} ${data.length === 1 ? 'jornalista encontrado' : 'jornalistas encontrados'}`}
          </Text>
          {hasActiveFilters && data.length > 0 && allJournalists.length > data.length ? (
            <Text as="span" tone="muted" variant="labelSm">
              (filtrado de {allJournalists.length} {allJournalists.length === 1 ? 'cadastro' : 'cadastros'})
            </Text>
          ) : null}
        </div>
      ) : null}

      <section className={styles.tableShell} aria-busy={isLoading}>
        {isLoading ? (
          <SectionState status="loading" loadingLabel="Carregando jornalistas…" minHeight={240} />
        ) : error ? (
          <SectionState
            status="error"
            errorMessage="Não foi possível carregar os jornalistas."
            errorDescription="Tente novamente para consultar os contatos."
            onRetry={() => void reload()}
            minHeight={240}
          />
        ) : (
          <DataTable
            columns={columns}
            data={pagedData}
            getRowKey={(journalist) => journalist.id}
            emptyState={emptyMessage}
            onRowClick={(journalist) => navigate(ROUTES.journalist(journalist.id))}
            rowActions={(journalist) => (
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate(ROUTES.journalist(journalist.id))}>
                Abrir perfil
              </Button>
            )}
          />
        )}
      </section>
      {!isLoading && !error ? (
        <Pagination
          className={styles.journalistPagination}
          aria-label="Paginação dos jornalistas"
          page={page}
          pageSize={JOURNALISTS_PAGE_SIZE}
          totalItems={data.length}
          onPageChange={setCurrentPage}
        />
      ) : null}
      <JournalistCreateDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        onCreate={createJournalist}
        topicSuggestions={filterOptions.topics}
        isPending={createPending}
        error={createError}
      />
    </div>
  )
}
