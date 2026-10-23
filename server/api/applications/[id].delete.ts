export default defineEventHandler(async (event) => {
  await deleteApplication(useRedis(event), String(getRouterParam(event, 'id')))
  return sendNoContent(event)
})
