export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, applicationSchema.parse)
  const record = await createApplication(useRedis(event), body)

  setResponseStatus(event, 201)
  return record
})
