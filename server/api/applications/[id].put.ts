
export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id'))
  const changes = clean(await readValidatedBody(event, applicationUpdateSchema.parse))
  const redis = useRedis(event)
  const key = `application:${id}`

  if (!(await redis.exists(key))) {
    throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  }

  if (Object.keys(changes).length) await redis.hset(key, changes)
  if (typeof changes.appliedDate === 'string') {
    await redis.zadd('applications', { score: Date.parse(changes.appliedDate), member: id })
  }
  return toRecord(await redis.hgetall(key))
})