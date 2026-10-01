import { z } from 'zod'

export const graphqlJournalistDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  roleTitle: z.string(),
  outletName: z.string(),
  desk: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  preferredChannel: z.enum(['email', 'whatsapp', 'phone']),
  bestContactWindow: z.string(),
  topics: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  objectiveStats: z.object({
    totalDemands: z.number(),
    solicitedCount: z.number(),
    proactiveCount: z.number(),
    successRate: z.number(),
    positioningUsageRate: z.number(),
  }),
  demandHistory: z.array(z.object({
    demandId: z.string(),
    title: z.string(),
    status: z.string(),
    occurredAt: z.string(),
    kindLabel: z.string(),
    outcomeLabel: z.string().nullable(),
  })),
  relationshipEvaluations: z.array(z.object({
    id: z.string(),
    authorUserId: z.string().nullable().optional(),
    authorName: z.string(),
    recordedAt: z.string(),
    score: z.number(),
    traits: z.array(z.string()),
    editorialToneLabel: z.string(),
    notes: z.string(),
  })),
})

export const graphqlJournalistListDtoSchema = z.object({
  items: z.array(graphqlJournalistDtoSchema),
  total: z.number(),
})

export type GraphQLJournalistDto = z.infer<typeof graphqlJournalistDtoSchema>
