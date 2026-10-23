export type Status = 'Applied' | 'Interview' | 'Offer' | 'Rejected'

export interface Application {
  id: string
  company: string
  position: string
  status: Status
  appliedDate: string
  link?: string
  notes?: string
}