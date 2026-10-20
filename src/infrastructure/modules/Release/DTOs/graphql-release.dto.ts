import { z } from 'zod'

export const graphqlReleaseRecipientDtoSchema = z.object({
  journalistId: z.string(),
  addedAt: z.string(),
  name: z.string().nullable(),
  outletName: z.string().nullable(),
})

export const graphqlReleaseDtoSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  subtitle: z.string(),
  body: z.string(),
  status: z.enum(['in_progress', 'sent']),
  tags: z.array(z.string()),
  publishedAt: z.string().nullable(),
  authorUserId: z.string(),
  authorName: z.string(),
  recipients: z.array(graphqlReleaseRecipientDtoSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const graphqlReleaseListDtoSchema = z.object({
  items: z.array(graphqlReleaseDtoSchema),
  total: z.number(),
})

export const graphqlRecipientImportPreviewDtoSchema = z.object({
  matchedCount: z.number(),
  createCount: z.number(),
  errorCount: z.number(),
  skippedCount: z.number(),
  lines: z.array(z.object({
    rowNumber: z.number(),
    name: z.string(),
    outletName: z.string(),
    email: z.string(),
    phone: z.string(),
    action: z.enum(['match', 'create', 'error']),
    journalistId: z.string().nullable(),
    error: z.string().nullable(),
  })),
})

export const graphqlReleaseTemplateDtoSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  contentBase64: z.string(),
})

export type GraphQLReleaseDto = z.infer<typeof graphqlReleaseDtoSchema>
