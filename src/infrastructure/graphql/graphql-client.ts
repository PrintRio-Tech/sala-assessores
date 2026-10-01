export class GraphQLClientError extends Error {
  readonly errors?: Array<{
    message?: string
    extensions?: { code?: string; metadata?: { code?: string } }
  }>

  constructor(
    message: string,
    errors?: Array<{
      message?: string
      extensions?: { code?: string; metadata?: { code?: string } }
    }>,
  ) {
    super(message)
    this.name = 'GraphQLClientError'
    this.errors = errors
  }
}

export interface GraphQLRequestOptions {
  accessToken?: string
}

type GraphQLResponse<T> = {
  data?: T
  errors?: NonNullable<GraphQLClientError['errors']>
}

export function resolveGraphqlEndpoint(
  explicit: string | undefined = import.meta.env.VITE_GRAPHQL_URL,
): string {
  if (explicit) return explicit
  return 'http://localhost:3010/graphql'
}

const endpoint = resolveGraphqlEndpoint()

export const graphqlClient = {
  async request<T>(
    query: string,
    variables?: Record<string, unknown>,
    options: GraphQLRequestOptions = {},
  ): Promise<T> {
    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.accessToken
            ? { Authorization: `Bearer ${options.accessToken}` }
            : {}),
        },
        body: JSON.stringify({ query, variables }),
      })
    } catch {
      throw new GraphQLClientError('Falha de rede ao falar com o GraphQL')
    }

    let json: GraphQLResponse<T>
    try {
      json = (await response.json()) as GraphQLResponse<T>
    } catch {
      throw new GraphQLClientError('Resposta GraphQL inválida')
    }

    if (json.errors?.length) {
      throw new GraphQLClientError(
        json.errors.map((error) => error.message ?? 'GraphQL error').join('; '),
        json.errors,
      )
    }

    if (!json.data) {
      throw new GraphQLClientError('Resposta GraphQL sem data')
    }

    return json.data
  },
}
