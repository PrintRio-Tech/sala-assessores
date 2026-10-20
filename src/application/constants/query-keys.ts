export const queryKeys = {
  demands: (params: unknown) => ['demands', params] as const,
  demand: (id: string) => ['demand', id] as const,
  journalist: (id: string) => ['journalist', id] as const,
  journalists: ['journalists'] as const,
  demandResponsibles: ['demand-responsibles'] as const,
  pressRoomReport: ['press-room-report'] as const,
  releases: {
    all: ['releases'] as const,
    list: (params: unknown) => ['releases', 'list', params] as const,
    detail: (id: string) => ['releases', 'detail', id] as const,
    tags: (search?: string) => ['releases', 'tags', search ?? ''] as const,
    template: ['releases', 'recipient-template'] as const,
  },
  auth: {
    all: ['auth'] as const,
    session: () => ['auth', 'session'] as const,
  },
}
