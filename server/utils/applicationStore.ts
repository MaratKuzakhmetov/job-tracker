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

export const MAX_CV_BYTES = 5 * 1024 * 1024

// keep only a plain display name: no folders, no odd characters
export const cvDisplayName = (name?: string) =>
  (name ?? '').split(/[\\/]/).pop()!.replace(/[^\p{L}\p{N} ._()-]/gu, '').slice(0, 100) || 'cv.pdf'

// check the file itself, not just the name or the type someone claims
export function assertPdf(bytes: Uint8Array) {
  if (!bytes.length) throw createError({ statusCode: 400, statusMessage: 'No file' })
  if (bytes.length > MAX_CV_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'File is too large (max 5 MB)' })
  }
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') {
    throw createError({ statusCode: 400, statusMessage: 'Only PDF files are allowed' })
  }
}

// download a PDF from a public https link (used by the MCP tool)
export async function fetchPdf(link: string) {
  const url = new URL(link)
  const host = url.hostname
  if (url.protocol !== 'https:' || host === 'localhost' || /^[\d.]+$/.test(host) || host.includes(':')) {
    throw createError({ statusCode: 400, statusMessage: 'Use a public https link' })
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!response.ok || !response.body) throw createError({ statusCode: 400, statusMessage: `Download failed (${response.status})` })

  // read at most the limit, so a huge file cannot fill memory
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    size += chunk.length
    if (size > MAX_CV_BYTES) throw createError({ statusCode: 413, statusMessage: 'File is too large (max 5 MB)' })
    chunks.push(chunk)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  assertPdf(bytes)
  return { bytes, name: cvDisplayName(decodeURIComponent(url.pathname.split('/').pop() || '')) }
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
