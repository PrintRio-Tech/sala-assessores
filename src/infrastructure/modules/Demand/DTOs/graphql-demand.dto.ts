import { z } from 'zod'

const demandStatusSchema = z.enum(['in_progress', 'sent', 'closed_without_send'])
const demandPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

export const graphqlDemandDtoSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  requestSummary: z.string(),
  factContext: z.string().nullable(),
  journalistId: z.string().nullable(),
  contactMode: z.enum(['known', 'local']),
  contactName: z.string().nullable(),
  contactOutlet: z.string().nullable(),
  journalistName: z.string(),
  outletName: z.string(),
  responsibleUserId: z.string(),
  responsibleName: z.string(),
  deadlineAt: z.string(),
  channel: z.string().nullable(),
  origin: z.enum(['solicited', 'proactive']),
  priority: demandPrioritySchema,
  status: demandStatusSchema,
  tags: z.array(z.string()),
  topics: z.array(z.string()),
  relatedAreas: z.array(z.string()),
  confirmedFacts: z.array(z.string()),
  pendingFacts: z.array(z.string()),
  enrichmentNextStep: z.string().nullable(),
  positioningState: z.enum(['empty', 'draft', 'approved', 'sent']),
  positioning: z.object({
    state: z.enum(['empty', 'draft', 'approved', 'sent']),
    versions: z.array(z.object({
      id: z.string(),
      body: z.string(),
      author: z.string(),
      savedAt: z.string(),
      attachment: z.object({
        filename: z.string(),
        contentType: z.string(),
        sizeBytes: z.number(),
        objectKey: z.string(),
        downloadUrl: z.string().nullable().optional(),
      }).nullable(),
    })),
    approval: z.object({
      approvedBy: z.string(),
      opinion: z.string(),
      approvedAt: z.string(),
      versionId: z.string(),
    }).nullable(),
  }).default({ state: 'empty', versions: [], approval: null }),
  interactions: z.array(z.object({
    id: z.string(),
    occurredAt: z.string(),
    recordedBy: z.string(),
    recordedByUserId: z.string().nullable().optional(),
    type: z.enum(['phone', 'email', 'meeting', 'legal_consult', 'other']).nullable(),
    result: z.enum([
      'waiting_response',
      'forwarded',
      'information_missing',
      'declined',
      'approved',
      'other',
      'response_sent',
      'closed_without_send',
    ]),
    participants: z.string().nullable(),
    summary: z.string().nullable(),
    nextStep: z.string().nullable(),
    channel: z.string().nullable(),
    recipient: z.string().nullable(),
    body: z.string().nullable(),
    origin: z.string(),
    positioningVersionId: z.string().nullable(),
  })).default([]),
  outcome: z.object({
    toneScore: z.number(),
    published: z.enum(['yes', 'no', 'unknown']),
    usageScore: z.number().nullable(),
    resultSummary: z.string(),
    recordedBy: z.string(),
    recordedByUserId: z.string().nullable().optional(),
    recordedAt: z.string(),
  }).nullable().default(null),
  stateTransitions: z.array(z.object({
    id: z.string(),
    fromStatus: demandStatusSchema,
    toStatus: demandStatusSchema,
    occurredAt: z.string(),
    recordedBy: z.string(),
    recordedByUserId: z.string().nullable().optional(),
    trigger: z.string(),
  })).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const graphqlDemandListDtoSchema = z.object({
  items: z.array(graphqlDemandDtoSchema),
  total: z.number(),
  activeCount: z.number(),
  historyCount: z.number(),
})

export type GraphQLDemandDto = z.infer<typeof graphqlDemandDtoSchema>

export const graphqlDemandResponsibleDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const graphqlAttachmentUploadDtoSchema = z.object({
  objectKey: z.string(),
  uploadUrl: z.string(),
  headers: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })),
})
