import { useState } from 'react'
import { Button, DatePicker, ICONS, TextInput } from '@print/ui'

import {
  countAdvancedReleaseFilters,
  countNonSearchReleaseFilters,
  hasActiveReleaseFilters,
} from '@/application/modules/Release/utils/release-list-params'
import { useReleaseFilterValues, useReleaseFilters } from '@/application/modules/Release/stores/release.store'
import { Icon } from '@/ui/components/DsIcon'

import { ReleasesFiltersDrawer } from '../ReleasesFiltersDrawer'

import styles from './styles.module.scss'

export function ReleasesListFilters() {
  const filters = useReleaseFilterValues()
  const setSearch = useReleaseFilters((state) => state.setSearch)
  const setPublishedFrom = useReleaseFilters((state) => state.setPublishedFrom)
  const setPublishedTo = useReleaseFilters((state) => state.setPublishedTo)
  const resetFilters = useReleaseFilters((state) => state.resetFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const hasFilters = hasActiveReleaseFilters(filters)
  const mobileFiltersCount = countNonSearchReleaseFilters(filters)
  const advancedCount = countAdvancedReleaseFilters(filters)

  return (
    <>
      <section aria-label="Filtros da lista" className={styles.root}>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <TextInput
              label="Pesquisar"
              labelSize="sm"
              name="releases-search"
              type="search"
              placeholder="Título, tag ou responsável…"
              value={filters.search}
              autoComplete="off"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className={styles.mobileActions}>
            <Button type="button" variant="outline" size="sm" className={styles.filtersButton} onClick={() => setFiltersOpen(true)}>
              Filtros
              {mobileFiltersCount > 0 ? <span className={styles.filtersBadge}>{mobileFiltersCount}</span> : null}
            </Button>
          </div>

          <fieldset className={styles.dateGroup}>
            <legend className={styles.dateLegend}>Publicação</legend>
            <div className={styles.dateFields}>
              <DatePicker
                label="De"
                labelHidden
                labelSize="sm"
                hideHint
                placeholder="De"
                name="release-published-from"
                value={filters.publishedFrom ?? ''}
                max={filters.publishedTo ?? undefined}
                onValueChange={(value) => setPublishedFrom(value || null)}
              />
              <DatePicker
                label="Até"
                labelHidden
                labelSize="sm"
                hideHint
                placeholder="Até"
                name="release-published-to"
                value={filters.publishedTo ?? ''}
                min={filters.publishedFrom ?? undefined}
                onValueChange={(value) => setPublishedTo(value || null)}
              />
            </div>
          </fieldset>

          <div className={styles.desktopActions}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              iconOnly
              className={styles.filterToggle}
              aria-label="Mais filtros"
              onClick={() => setFiltersOpen(true)}
            >
              <Icon src={ICONS.ui.filter} size={16} aria-hidden />
              {advancedCount > 0 ? <span className={styles.filtersBadgeFloating}>{advancedCount}</span> : null}
            </Button>

            {hasFilters ? (
              <Button type="button" variant="ghost" size="sm" className={styles.clearButton} onClick={resetFilters}>
                Limpar
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <ReleasesFiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
    </>
  )
}
