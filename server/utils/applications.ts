import { z } from 'zod'

export const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'] as const

const fields = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  status: z.enum(statuses),
  appliedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  link: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

// create: status falls back to 'Applied'
export const applicationSchema = fields.extend({
  status: z.enum(statuses).default('Applied'),
})

// update: every field optional, and no defaults that could overwrite data
export const applicationUpdateSchema = fields.partial()

// drop undefined values before writing to Redis
export const clean = (obj: object) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))