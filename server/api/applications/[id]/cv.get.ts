export default defineEventHandler(async (event) => {
  const bytes = await readCv(parseId(getRouterParam(event, 'id')))
  if (!bytes) throw createError({ statusCode: 404, statusMessage: 'No CV' })

  return new Response(bytes, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="cv.pdf"',
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, no-store',
    },
  })
})
