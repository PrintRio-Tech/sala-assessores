import { useMemo } from 'react'
import { Button, DatePicker, DrawerShell, SelectField } from '@print/ui'

import { useReleaseFilterValues, useReleaseFilters } from '@/application/modules/Release/stores/release.store'
import { useIsMobile } from '@/ui/hooks/use-is-mobile'
import { TagInput } from '@/ui/pages/Release/components/TagInput'

import { FILTER_ALL_VALUE, RELEASE_STATUS_OPTIONS, withFilterAllOption } from '../../constants'

import styles from './styles.module.scss'

type ReleasesFiltersDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReleasesFiltersDrawer({ open, onOpenChange }: ReleasesFiltersDrawerProps) {
  const isMobile = useIsMobile()
  const filters = useReleaseFilterValues()
  const setStatus = useReleaseFilters((state) => state.setStatus)
  const setTags = useReleaseFilters((state) => state.setTags)
  const setPublishedFrom = useReleaseFilters((state) => state.setPublishedFrom)
  const setPublishedTo = useReleaseFilters((state) => state.setPublishedTo)
  const resetAdvancedFilters = useReleaseFilters((state) => state.resetAdvancedFilters)
  const resetNonSearchFilters = useReleaseFilters((state) => state.resetNonSearchFilters)

  const statusOptions = useMemo(
    () => withFilterAllOption(RELEASE_STATUS_OPTIONS, 'Todos os status'),
    [],
  )

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Filtros"
      description={isMobile ? 'Refine a lista por status, tags e período.' : 'Status e tags.'}
      size="md"
      closeLabel="Fechar filtros"
      footerAlign="between"
      footer={(
        <>
          <Button type="button" variant="ghost" onClick={() => {
            if (isMobile) resetNonSearchFilters()
            else resetAdvancedFilters()
          }}>
            Limpar filtros
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>Salvar</Button>
        </>
      )}
    >
      <div className={styles.fields}>
        {isMobile ? (
          <fieldset className={styles.dateGroup}>
            <legend className={styles.dateLegend}>Publicação</legend>
            <div className={styles.dateFields}>
              <DatePicker
                label="De"
                hideHint
                placeholder="Início"
                name="release-published-from-drawer"
                value={filters.publishedFrom ?? ''}
                max={filters.publishedTo ?? undefined}
                onValueChange={(value) => setPublishedFrom(value || null)}
              />
              <DatePicker
                label="Até"
                hideHint
                placeholder="Fim"
                name="release-published-to-drawer"
                value={filters.publishedTo ?? ''}
                min={filters.publishedFrom ?? undefined}
                onValueChange={(value) => setPublishedTo(value || null)}
              />
            </div>
          </fieldset>
        ) : null}

        <SelectField
          label="Status"
          name="release-filter-status"
          placeholder="Todos os status"
          options={statusOptions}
          value={filters.status ?? FILTER_ALL_VALUE}
          onValueChange={(value) => setStatus(value === FILTER_ALL_VALUE ? null : value)}
        />

        <TagInput tags={filters.tags} label="Tags" layout="stacked" hideHint onChange={setTags} />
      </div>
    </DrawerShell>
  )
}
