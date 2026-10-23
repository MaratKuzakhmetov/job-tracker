export default defineEventHandler(async (event) => {
  const session = await useAppSession(event)
  return { loggedIn: Boolean(session.data.loggedIn) }
})
