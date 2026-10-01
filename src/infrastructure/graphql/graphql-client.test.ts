import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  GraphQLClientError,
  graphqlClient,
  resolveGraphqlEndpoint,
} from './graphql-client'

describe('graphql-client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('usa o endpoint do BFF imprensa por padrão', () => {
    expect(resolveGraphqlEndpoint()).toBe('http://localhost:3010/graphql')
  })

  it('só envia Bearer quando pedido e propaga errors[].extensions.code', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => ({
        errors: [
          {
            message: 'Too many requests',
            extensions: { code: 'RATE_LIMITED', metadata: { code: 'RATE_LIMITED' } },
          },
        ],
      }),
    })

    await expect(
      graphqlClient.request('mutation { requestMagicLink(email: "a@b.com") { ok } }', {
        email: 'a@b.com',
      }),
    ).rejects.toMatchObject({
      name: 'GraphQLClientError',
      errors: [
        expect.objectContaining({
          extensions: expect.objectContaining({ code: 'RATE_LIMITED' }),
        }),
      ],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3010/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.variables).toEqual({ email: 'a@b.com' })
  })

  it('anexa Authorization só na operação autenticada', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => ({ data: { me: null } }),
    })

    await graphqlClient.request(
      'query Me { me { id } }',
      undefined,
      { accessToken: 'bff-access' },
    )

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer bff-access',
    })
  })

  it('expõe GraphQLClientError para falha de rede', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(graphqlClient.request('query { me { id } }')).rejects.toBeInstanceOf(
      GraphQLClientError,
    )
  })
})
