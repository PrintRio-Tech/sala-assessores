import { Table, TableHead, TableHeader, TableRow } from '@print/ui'

import { useReleaseFilters } from '@/application/modules/Release/stores/release.store'
import { sortFromReleaseColumn, tableSortFromReleaseSort } from '@/application/modules/Release/utils/release-list-params'

import styles from './styles.module.scss'

const RELEASE_SORT_COLUMNS = [
  { id: 'title', header: 'Título' },
  { id: 'status', header: 'Status' },
  { id: 'publishedAt', header: 'Publicação' },
  { id: 'author', header: 'Responsável' },
] as const

export function ReleasesListSort() {
  const sort = useReleaseFilters((state) => state.sort)
  const setSort = useReleaseFilters((state) => state.setSort)
  const tableSort = tableSortFromReleaseSort(sort)

  return (
    <div className={styles.root}>
      <Table aria-label="Ordenar lista de releases">
        <TableHeader>
          <TableRow>
            {RELEASE_SORT_COLUMNS.map((column) => (
              <TableHead
                key={column.id}
                sortable
                sortDirection={tableSort?.key === column.id ? tableSort.direction : null}
                onSort={() => setSort(sortFromReleaseColumn(sort, column.id))}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>
    </div>
  )
}
