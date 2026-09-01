import { useDemand } from './use-demand'
import { buildDemandDetailViewModel, buildLocalDemandDetailViewModel } from '../presentation/demand-detail.viewmodel'

export function useDemandDetailView(id: string | undefined) {
  const demandQuery = useDemand(id)
  return {
    ...demandQuery,
    source: demandQuery.data,
    data: demandQuery.localRecord
      ? buildLocalDemandDetailViewModel(demandQuery.localRecord)
      : demandQuery.data && !('factContext' in demandQuery.data)
        ? buildDemandDetailViewModel(demandQuery.data)
        : null,
  }
}
