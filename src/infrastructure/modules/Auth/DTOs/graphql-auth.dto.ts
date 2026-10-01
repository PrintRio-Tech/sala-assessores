import { z } from 'zod'

export const graphqlUserDtoSchema = z.object({
  id: z.string(),
  personId: z.string(),
  email: z.email(),
  emails: z.array(z.string()),
  name: z.string().nullable(),
  role: z.string(),
  app: z.string(),
  isAdmin: z.boolean(),
})

export const graphqlSessionDtoSchema = z.object({
  user: graphqlUserDtoSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const graphqlMagicLinkResponseDtoSchema = z.object({
  ok: z.literal(true),
})

export const graphqlLogoutResponseDtoSchema = z.object({
  ok: z.literal(true),
})

export type GraphQLUserDto = z.infer<typeof graphqlUserDtoSchema>
export type GraphQLSessionDto = z.infer<typeof graphqlSessionDtoSchema>
