export default defineEventHandler(async (event) => {
  const id = parseId(getRouterParam(event, 'id'))

  // refuse big uploads before reading them
  if (Number(getRequestHeader(event, 'content-length') ?? 0) > MAX_CV_BYTES + 100_000) {
    throw createError({ statusCode: 413, statusMessage: 'File is too large (max 5 MB)' })
  }

  const parts = await readMultipartFormData(event)
  const file = parts?.find((part) => part.name === 'file')
  if (!file) throw createError({ statusCode: 400, statusMessage: 'No file' })
  assertPdf(file.data)

  const record = await saveCv(useRedis(event), id, cvDisplayName(file.filename), file.data)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  return record
})
