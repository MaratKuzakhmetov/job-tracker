import { z } from 'zod'

export const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'] as const

export const languages = ['EN', 'DE'] as const

const fields = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  status: z.enum(statuses),
  language: z.enum(languages),
  appliedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // http(s) only: blocks javascript: and data: links that would run when clicked
  link: z.url({ protocol: /^https?$/ }).optional().or(z.literal('')),
  notes: z.string().optional(),
})

// create: status falls back to 'Applied'
export const applicationSchema = fields.extend({
  status: z.enum(statuses).default('Applied'),
  language: z.enum(languages).default('EN'),
})

// update: every field optional, and no defaults that could overwrite data
export const applicationUpdateSchema = fields.partial()

// drop undefined values before writing to Redis
export const clean = (obj: object) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))