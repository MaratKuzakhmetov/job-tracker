const MAX_BYTES = 5 * 1024 * 1024

// keep only a plain display name: no folders, no odd characters
const displayName = (name?: string) =>
  (name ?? '').split(/[\\/]/).pop()!.replace(/[^\p{L}\p{N} ._()-]/gu, '').slice(0, 100) || 'cv.pdf'

export default defineEventHandler(async (event) => {
  const id = parseId(getRouterParam(event, 'id'))

  // refuse big uploads before reading them
  if (Number(getRequestHeader(event, 'content-length') ?? 0) > MAX_BYTES + 100_000) {
    throw createError({ statusCode: 413, statusMessage: 'File is too large (max 5 MB)' })
  }

  const parts = await readMultipartFormData(event)
  const file = parts?.find((part) => part.name === 'file')
  if (!file?.data.length) throw createError({ statusCode: 400, statusMessage: 'No file' })
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'File is too large (max 5 MB)' })
  }
  // check the file itself, not just the name or the type the browser claims
  if (new TextDecoder().decode(file.data.subarray(0, 5)) !== '%PDF-') {
    throw createError({ statusCode: 400, statusMessage: 'Only PDF files are allowed' })
  }

  const record = await saveCv(useRedis(event), id, displayName(file.filename), file.data)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  return record
})
