export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id'))
  const changes = await readValidatedBody(event, applicationUpdateSchema.parse)

  const record = await updateApplication(useRedis(event), id, changes)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  return record
})
