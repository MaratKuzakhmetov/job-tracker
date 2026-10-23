export default defineEventHandler(async (event) => {
  const { status } = getQuery(event)
  const redis = useRedis(event)

  const ids = await redis.zrange('applications', 0, -1, { rev: true })
  if (!ids.length) return []

  const pipeline = redis.pipeline()
  for (const id of ids) pipeline.hgetall(`application:${id}`)
  const rows = (await pipeline.exec<unknown[]>()).map(toRecord).filter((row) => row.id)

  return status ? rows.filter((row) => row.status === status) : rows
})