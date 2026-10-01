export interface MutationOptions<TData> {
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
}
