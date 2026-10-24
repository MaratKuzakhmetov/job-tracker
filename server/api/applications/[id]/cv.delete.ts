export default defineEventHandler(async (event) => {
  const record = await removeCv(useRedis(event), parseId(getRouterParam(event, 'id')))
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  return record
})
