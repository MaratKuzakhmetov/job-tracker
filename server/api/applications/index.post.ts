export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, applicationSchema.parse)
  const redis = useRedis(event)

  const id = String(await redis.incr('application:next_id'))
  const record = {
    id,
    ...clean(body),
    appliedDate: body.appliedDate ?? new Date().toISOString().slice(0, 10),
  }

  await redis.hset(`application:${id}`, record)
  await redis.zadd('applications', { score: Date.parse(record.appliedDate), member: id })

  setResponseStatus(event, 201)
  return record
})