export default defineEventHandler(async (event) => {
  const { status } = getQuery(event)
  return listApplications(useRedis(event), typeof status === 'string' ? status : undefined)
})
