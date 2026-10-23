export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/') || path.startsWith('/api/auth/')) return

  const session = await useAppSession(event)
  if (!session.data.loggedIn) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
