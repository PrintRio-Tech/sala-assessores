import { useQuery } from '@tanstack/react-query'

import { reportService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { PressRoomReport } from '@/domain/Report/press-room-report'

export type { PressRoomReport }

export function usePressRoomReport() {
  const query = useQuery({
    queryKey: queryKeys.pressRoomReport,
    queryFn: () => reportService.get(),
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  }
}
