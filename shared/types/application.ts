export type Status = 'Applied' | 'Interview' | 'Offer' | 'Rejected'

export type Language = 'EN' | 'DE'

export interface Application {
  id: string
  company: string
  position: string
  status: Status
  language: Language
  appliedDate: string
  link?: string
  notes?: string
}