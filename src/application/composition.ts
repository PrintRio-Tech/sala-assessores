import { QueryClient } from '@tanstack/react-query'

import { DemandService } from '@/application/modules/Demand/service/demand.service'
import { JournalistService } from '@/application/modules/Journalist/service/journalist.service'
import { MockDemandRepository } from '@/infrastructure/modules/Demand/demand.repository'
import { MockJournalistRepository } from '@/infrastructure/modules/Journalist/journalist.repository'

export const demandService = new DemandService(new MockDemandRepository())
export const journalistService = new JournalistService(
  new MockJournalistRepository(),
)

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
    },
  },
})
