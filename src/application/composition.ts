import { QueryClient } from '@tanstack/react-query'

import { AuthService } from '@/application/modules/Auth/service/auth.service'
import type { AuthRepository } from '@/domain/Auth/auth.repository'
import { GraphQLAuthRepository } from '@/infrastructure/modules/Auth/graphql-auth.repository'
import { GraphQLDemandRepository } from '@/infrastructure/modules/Demand/graphql-demand.repository'
import { GraphQLJournalistRepository } from '@/infrastructure/modules/Journalist/graphql-journalist.repository'
import { GraphQLPressRoomReportRepository } from '@/infrastructure/modules/Report/graphql-press-room-report.repository'
import { GraphQLReleaseRepository } from '@/infrastructure/modules/Release/graphql-release.repository'

import {
  demandService,
  journalistService,
  releaseService,
  reportService,
  resetInMemoryAdapters,
} from './in-memory-adapters'

demandService.use(new GraphQLDemandRepository())
journalistService.use(new GraphQLJournalistRepository())
releaseService.use(new GraphQLReleaseRepository())
reportService.use(new GraphQLPressRoomReportRepository())

export { demandService, journalistService, releaseService, reportService, resetInMemoryAdapters }

export const auth = {
  service: new AuthService(new GraphQLAuthRepository()),
  use(repo: AuthRepository) {
    this.service = new AuthService(repo)
  },
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
    },
  },
})
