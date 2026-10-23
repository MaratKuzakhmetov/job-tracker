export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const { loggedIn } = await $fetch('/api/auth/me', {
    headers: useRequestHeaders(['cookie']),
  })
  if (!loggedIn) return navigateTo('/login')
})
