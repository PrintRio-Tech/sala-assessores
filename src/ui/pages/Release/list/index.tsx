import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pagination, Text } from '@print/ui'

import { useReleaseFilterValues, useReleaseFilters } from '@/application/modules/Release/stores/release.store'
import { buildReleaseListParams, hasActiveReleaseFilters } from '@/application/modules/Release/utils/release-list-params'
import { useDebouncedValue } from '@/application/shared/use-debounced-value'
import { useReleases } from '@/application/modules/Release/hooks/use-releases'
import { ROUTES } from '@/ui/routes/paths'

import { ReleaseCreateButton } from './components/ReleaseCreateButton'
import { ReleaseListCard } from './components/ReleaseListCard'
import { ReleasesEmptyState } from './components/ReleasesEmptyState'
import { ReleasesHero } from './components/ReleasesHero'
import { ReleasesListFilters } from './components/ReleasesListFilters'
import { ReleasesListSort } from './components/ReleasesListSort'
import { ReleaseViewSheet } from './components/ReleaseViewSheet'

import styles from './styles.module.scss'

const PAGE_SIZE = 20

export function ReleasesPage() {
  const navigate = useNavigate()
  const filters = useReleaseFilterValues()
  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const viewingReleaseId = useReleaseFilters((state) => state.selectedReleaseId)
  const setViewingReleaseId = useReleaseFilters((state) => state.setSelectedReleaseId)
  const setPage = useReleaseFilters((state) => state.setPage)

  const handleCreate = () => {
    navigate(ROUTES.releaseCreate)
  }

  const listParams = useMemo(
    () => buildReleaseListParams({ ...filters, search: debouncedSearch }, { page: filters.page, pageSize: PAGE_SIZE }),
    [filters, debouncedSearch],
  )

  const { data: releases, total, isLoading } = useReleases(listParams)
  const showEmptyState = !isLoading && releases.length === 0 && !hasActiveReleaseFilters(filters)

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <ReleasesHero />
        <ReleaseCreateButton onClick={handleCreate} />
      </div>

      {showEmptyState ? (
        <ReleasesEmptyState onCreate={handleCreate} />
      ) : (
        <div className={styles.content}>
          <ReleasesListFilters />

          {isLoading && releases.length === 0 ? (
            <Text as="p" variant="bodyMd" tone="muted" aria-live="polite">Carregando releases…</Text>
          ) : null}

          {!isLoading && releases.length === 0 ? (
            <Text as="p" variant="bodyMd" tone="muted">Nenhum release encontrado com os filtros atuais.</Text>
          ) : null}

          {releases.length > 0 ? (
            <section aria-label="Lista de releases" className={styles.listSection}>
              <div className={styles.listHeader}>
                <Text as="span" variant="labelMd">Todos os releases</Text>
                <Text as="span" variant="labelSm" tone="muted">
                  {total} {total === 1 ? 'item' : 'itens'}
                </Text>
              </div>

              <ReleasesListSort />

              <ul className={styles.list}>
                {releases.map((release) => (
                  <li key={release.id}>
                    <ReleaseListCard release={release} onOpen={() => setViewingReleaseId(release.id)} />
                  </li>
                ))}
              </ul>

              {total > 0 ? (
                <Pagination page={filters.page} pageSize={PAGE_SIZE} totalItems={total} onPageChange={setPage} />
              ) : null}
            </section>
          ) : null}
        </div>
      )}

      <ReleaseViewSheet
        releaseId={viewingReleaseId}
        open={viewingReleaseId != null}
        onOpenChange={(open) => { if (!open) setViewingReleaseId(null) }}
      />
    </div>
  )
}
