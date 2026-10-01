import { useQuery } from '@tanstack/react-query'

import { reportService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { PressRoomReport, PressRoomReportFilter } from '@/domain/Report/press-room-report'

export type { PressRoomReport, PressRoomReportFilter }

export function usePressRoomReport(filter: PressRoomReportFilter = {}) {
  const query = useQuery({
    queryKey: [...queryKeys.pressRoomReport, filter],
    queryFn: () => reportService.get(filter),
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  }
}
