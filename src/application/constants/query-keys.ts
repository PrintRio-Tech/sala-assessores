export const queryKeys = {
  demands: (params: unknown) => ['demands', params] as const,
  demand: (id: string) => ['demand', id] as const,
  journalist: (id: string) => ['journalist', id] as const,
  journalists: ['journalists'] as const,
  demandResponsibles: ['demand-responsibles'] as const,
  pressRoomReport: ['press-room-report'] as const,
  auth: {
    all: ['auth'] as const,
    session: () => ['auth', 'session'] as const,
  },
}
