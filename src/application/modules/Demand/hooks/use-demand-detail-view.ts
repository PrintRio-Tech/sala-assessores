import { useDemand } from './use-demand'
import { buildDemandDetailViewModel } from '../presentation/demand-detail.viewmodel'

export function useDemandDetailView(id: string | undefined) {
  const demandQuery = useDemand(id)
  return {
    ...demandQuery,
    source: demandQuery.data,
    data: demandQuery.data ? buildDemandDetailViewModel(demandQuery.data) : null,
  }
}
