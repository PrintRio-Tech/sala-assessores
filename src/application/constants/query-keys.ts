export const queryKeys = {
  demands: (params: unknown) => ['demands', params] as const,
  demand: (id: string) => ['demand', id] as const,
  journalist: (id: string) => ['journalist', id] as const,
  journalists: ['journalists'] as const,
}
