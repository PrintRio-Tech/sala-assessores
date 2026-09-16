import { z } from 'zod'

export const demandStatusDtoSchema = z.enum([
  'in_progress',
  'sent',
  'closed_without_send',
])

export const externalInteractionDtoSchema = z.object({
  id: z.string(),
  occurred_at: z.string(),
  recorded_by: z.string().nullish(),
  type: z.enum(['phone', 'email', 'meeting', 'legal_consult', 'other']).nullish(),
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
  participants: z.string().nullish(),
  summary: z.string().nullish(),
  next_step: z.string().nullish(),
  channel: z.string().nullish(),
  recipient: z.string().nullish(),
  body: z.string().nullish(),
  origin: z.literal('off_platform'),
  positioning_version_id: z.string().nullish(),
})

export const demandDtoSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  request_summary: z.string(),
  fact_context: z.string().optional(),
  journalist_id: z.string(),
  journalist_name: z.string(),
  outlet_name: z.string(),
  responsible_id: z.string(),
  responsible_name: z.string(),
  deadline_at: z.string(),
  channel: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: demandStatusDtoSchema,
  created_at: z.string(),
  updated_at: z.string(),
  interactions: z.array(externalInteractionDtoSchema),
  enrichment: z.object({
    tags: z.array(z.string()), topics: z.array(z.string()), related_areas: z.array(z.string()),
    confirmed_facts: z.array(z.string()), pending_facts: z.array(z.string()), next_step: z.string().nullable(),
  }).optional(),
  state_transitions: z.array(z.object({
    id: z.string(), from: demandStatusDtoSchema, to: demandStatusDtoSchema, occurred_at: z.string(), recorded_by: z.string(),
    trigger: z.enum(['response_sent', 'closed_without_send']),
  })).optional(),
  positioning: z.object({
    state: z.enum(['empty', 'draft', 'approved', 'sent']),
    versions: z.array(z.object({
      id: z.string(),
      body: z.string(),
      author: z.string(),
      saved_at: z.string(),
      attachment: z.object({
        filename: z.string(),
        content_type: z.string(),
        size_bytes: z.number(),
        object_url: z.string(),
      }).nullish(),
    })),
    approval: z.object({
      approved_by: z.string(),
      opinion: z.string(),
      approved_at: z.string(),
      version_id: z.string(),
    }).nullish(),
  }).optional(),
  outcome: z.object({
    tone_score: z.number().int().min(1).max(5),
    published: z.enum(['yes', 'no', 'unknown']),
    usage_score: z.number().int().min(1).max(5).nullable(),
    result_summary: z.string(),
    recorded_by: z.string(),
    recorded_at: z.string(),
  }).nullish(),
})

export type DemandDto = z.infer<typeof demandDtoSchema>
