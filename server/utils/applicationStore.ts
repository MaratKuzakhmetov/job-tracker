import type { Redis } from '@upstash/redis'
import type { z } from 'zod'

// Redis access for applications, shared by the REST routes and the MCP tools
type NewApplication = z.infer<typeof applicationSchema>
type ApplicationChanges = z.infer<typeof applicationUpdateSchema>

export async function listApplications(redis: Redis, status?: string) {
  const ids = await redis.zrange('applications', 0, -1, { rev: true })
  if (!ids.length) return []

  const pipeline = redis.pipeline()
  for (const id of ids) pipeline.hgetall(`application:${id}`)
  const rows = (await pipeline.exec<unknown[]>()).map(toRecord).filter((row) => row.id)

  return status ? rows.filter((row) => row.status === status) : rows
}

export async function createApplication(redis: Redis, body: NewApplication) {
  const id = String(await redis.incr('application:next_id'))
  const record = {
    id,
    ...clean(body),
    appliedDate: body.appliedDate ?? new Date().toISOString().slice(0, 10),
  }

  await redis.hset(`application:${id}`, record)
  await redis.zadd('applications', { score: Date.parse(record.appliedDate), member: id })
  return record
}

// returns null when the application does not exist
export async function updateApplication(redis: Redis, id: string, input: ApplicationChanges) {
  const key = `application:${id}`
  if (!(await redis.exists(key))) return null

  const changes = clean(input)
  if (Object.keys(changes).length) await redis.hset(key, changes)
  if (typeof changes.appliedDate === 'string') {
    await redis.zadd('applications', { score: Date.parse(changes.appliedDate), member: id })
  }
  return toRecord(await redis.hgetall(key))
}

export async function deleteApplication(redis: Redis, id: string) {
  await redis.del(`application:${id}`)
  await redis.zrem('applications', id)
  // best effort: the application is gone even if the file cannot be removed
  await useStorage('cv').removeItem(`${id}.pdf`).catch(() => {})
}

// ids are plain numbers; reject anything else before it reaches storage keys
export function parseId(value: unknown) {
  const id = String(value)
  if (!/^\d+$/.test(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  return id
}

// CV (PDF) per application: file in storage 'cv', display name in the Redis hash
export async function saveCv(redis: Redis, id: string, name: string, bytes: Uint8Array) {
  const key = `application:${id}`
  if (!(await redis.exists(key))) return null
  await useStorage('cv').setItemRaw(`${id}.pdf`, bytes)
  await redis.hset(key, { cvName: name })
  return toRecord(await redis.hgetall(key))
}

export async function readCv(id: string) {
  const raw = await useStorage('cv').getItemRaw(`${id}.pdf`)
  return raw ? new Uint8Array(raw as ArrayBuffer) : null
}

export async function removeCv(redis: Redis, id: string) {
  const key = `application:${id}`
  if (!(await redis.exists(key))) return null
  await useStorage('cv').removeItem(`${id}.pdf`)
  await redis.hdel(key, 'cvName')
  return toRecord(await redis.hgetall(key))
}
