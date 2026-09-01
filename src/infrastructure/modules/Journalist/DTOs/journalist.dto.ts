import { z } from 'zod'

export const journalistDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  role_title: z.string(),
  outlet_name: z.string(),
  desk: z.string(),
  email: z.string(),
  phone: z.string(),
  preferred_channel: z.enum(['email', 'whatsapp', 'phone']),
  best_contact_window: z.string(),
  topics: z.array(z.string()),
  is_active: z.boolean(),
  objective_stats: z.object({
    total_demands: z.number(),
    solicited_count: z.number(),
    proactive_count: z.number(),
    success_rate: z.number(),
    positioning_usage_rate: z.number(),
  }),
  demand_history: z.array(
    z.object({
      demand_id: z.string(),
      title: z.string(),
      status: z.string(),
      occurred_at: z.string(),
      kind_label: z.string(),
    }),
  ),
  relationship_evaluations: z.array(
    z.object({
      id: z.string(),
      author_name: z.string(),
      recorded_at: z.string(),
      score: z.number(),
      traits: z.array(z.string()),
      editorial_tone_label: z.string(),
      notes: z.string(),
    }),
  ),
})

export type JournalistDto = z.infer<typeof journalistDtoSchema>
