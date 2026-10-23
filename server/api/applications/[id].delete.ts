export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id'))
  const redis = useRedis(event)

  await redis.del(`application:${id}`)
  await redis.zrem('applications', id)
  return sendNoContent(event)
})