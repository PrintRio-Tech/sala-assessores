import { z } from 'zod'

export const demandStatusDtoSchema = z.enum([
  'draft',
  'in_progress',
  'pending_review',
  'changes_requested',
  'approved',
  'sent',
  'closed_without_send',
])

export const externalInteractionDtoSchema = z.object({
  id: z.string(),
  occurred_at: z.string(),
  recorded_by: z.string().nullish(),
  type: z.enum(['phone', 'email', 'meeting', 'legal_consult', 'other']).nullish(),
  result: z.enum(['waiting_response', 'information_missing', 'declined', 'resolved', 'forwarded', 'other']),
  participants: z.string().nullish(),
  summary: z.string().nullish(),
  next_step: z.string().nullish(),
  origin: z.literal('off_platform'),
})

export const demandDecisionDtoSchema = z.object({
  id: z.string(),
  decided_at: z.string(),
  consulted_party: z.string(),
  decision: z.enum(['approved', 'changes_requested', 'rejected']),
  rationale: z.string(),
})

export const finalPositioningDtoSchema = z.object({
  version_label: z.string(),
  channel: z.string(),
  sent_at: z.string(),
  recipient: z.string(),
  body: z.string(),
})

export const demandDtoSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  request_summary: z.string(),
  journalist_id: z.string(),
  journalist_name: z.string(),
  outlet_name: z.string(),
  responsible_id: z.string(),
  responsible_name: z.string(),
  deadline_at: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: demandStatusDtoSchema,
  created_at: z.string(),
  updated_at: z.string(),
  interactions: z.array(externalInteractionDtoSchema),
  decisions: z.array(demandDecisionDtoSchema),
  final_positioning: finalPositioningDtoSchema.nullable(),
  enrichment: z.object({
    tags: z.array(z.string()), topics: z.array(z.string()), related_areas: z.array(z.string()),
    confirmed_facts: z.array(z.string()), pending_facts: z.array(z.string()), next_step: z.string().nullable(),
  }).optional(),
  review_requests: z.array(z.object({
    id: z.string(), requested_at: z.string(), requested_by: z.string(), reviewer: z.string(), version_label: z.string(),
  })).optional(),
  versions: z.array(z.object({ id: z.string(), version_label: z.string(), body: z.string(), created_at: z.string(), created_by: z.string() })).optional(),
  state_transitions: z.array(z.object({
    id: z.string(), from: demandStatusDtoSchema, to: demandStatusDtoSchema, occurred_at: z.string(), recorded_by: z.string(),
    trigger: z.enum(['enrichment', 'review_requested', 'decision', 'new_version', 'positioning_sent', 'closed_without_send']),
  })).optional(),
  closure: z.object({ closed_at: z.string(), closed_by: z.string(), reason: z.string() }).nullable().optional(),
})

export type DemandDto = z.infer<typeof demandDtoSchema>
