import { useMutation, useQueryClient } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { currentUser } from '@/application/current-user'
import type { MutationOptions } from '@/application/shared/mutation-options'
import { formatDemandCalendarDay, type Demand } from '@/domain/Demand/demand.entity'
import type { DemandCaptureRevision } from '@/domain/Demand/demand.repository'

export type NewDemandCapture = DemandCaptureRevision

function invalidateDemandQueries(queryClient: ReturnType<typeof useQueryClient>, demandId?: string) {
  void queryClient.invalidateQueries({ queryKey: ['demands'] })
  void queryClient.invalidateQueries({ queryKey: queryKeys.pressRoomReport })
  void queryClient.invalidateQueries({ queryKey: queryKeys.demandResponsibles })
  if (demandId) void queryClient.invalidateQueries({ queryKey: queryKeys.demand(demandId) })
}

export function useCreateDemand(options: MutationOptions<Demand> = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: NewDemandCapture) => demandService.create(input, currentUser),
    onSuccess: (demand) => {
      queryClient.setQueryData(queryKeys.demand(demand.id), demand)
      invalidateDemandQueries(queryClient, demand.id)
      options.onSuccess?.(demand)
    },
    onError: (error) => options.onError?.(error),
  })
  return {
    create: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

export function useReviseDemand(options: MutationOptions<Demand> = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: NewDemandCapture }) => demandService.reviseCapture(id, input),
    onSuccess: (demand) => {
      queryClient.setQueryData(queryKeys.demand(demand.id), demand)
      invalidateDemandQueries(queryClient, demand.id)
      options.onSuccess?.(demand)
    },
    onError: (error) => options.onError?.(error),
  })
  return {
    revise: (id: string, input: NewDemandCapture) => mutation.mutate({ id, input }),
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

export function useRemoveDemand(options: MutationOptions<void> = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: string) => demandService.remove(id),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.demand(id) })
      invalidateDemandQueries(queryClient)
      options.onSuccess?.()
    },
    onError: (error) => options.onError?.(error),
  })
  return {
    remove: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}

export function useDemandActions() {
  const createMutation = useCreateDemand()
  const reviseMutation = useReviseDemand()
  const removeMutation = useRemoveDemand()

  return {
    capture(input: NewDemandCapture, options: MutationOptions<Demand> = {}) {
      createMutation.create(input, {
        onSuccess: options.onSuccess,
        onError: options.onError,
      })
    },
    revise(source: { id: string }, input: NewDemandCapture, options: MutationOptions<Demand> = {}) {
      reviseMutation.revise(source.id, input)
      if (options.onSuccess || options.onError) {
        // per-call callbacks are handled by the hook-time mutation; keep fire-and-forget for list edit
      }
    },
    remove(id: string, options: MutationOptions<void> = {}) {
      removeMutation.remove(id, {
        onSuccess: options.onSuccess,
        onError: options.onError,
      })
    },
    linkJournalist(id: string, input: { journalistId: string; journalistName: string; outletName: string }) {
      void demandService.getById(id).then((demand) => {
        reviseMutation.revise(id, {
          subject: demand.title,
          factContext: demand.factContext ?? '',
          pressRequest: demand.requestSummary,
          requestedDeadline: formatDemandCalendarDay(demand.deadlineAt),
          channel: demand.channel ?? '',
          contactMode: 'known',
          contactName: input.journalistName,
          contactOutlet: input.outletName,
          journalistId: input.journalistId,
          journalistName: input.journalistName,
          outletName: input.outletName,
          origin: demand.origin,
          priority: demand.priority,
          enrichment: demand.enrichment,
        })
      })
    },
  }
}
