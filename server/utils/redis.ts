import { Redis } from '@upstash/redis'
import type { H3Event } from 'h3'

export function useRedis(event: H3Event) {
  const config = useRuntimeConfig(event)
  return new Redis({
    url: config.upstashRedisRestUrl,
    token: config.upstashRedisRestToken,
    automaticDeserialization: false,
  })
}

// with automaticDeserialization off, hgetall returns a flat array
// ['field', 'value', ...]; turn it back into an object
export function toRecord(flat: unknown): Record<string, string> {
  const list = Array.isArray(flat) ? flat : []
  const record: Record<string, string> = {}
  for (let i = 0; i < list.length; i += 2) record[list[i]] = list[i + 1]
  return record
}
