export default defineNuxtRouteMiddleware(async (to) => {
  const isGuestRoute = to.path === '/login' || to.path === '/register'

  const { user, fetchUser } = useAuthUser()

  if (!user.value) {
    await fetchUser()
  }

  if (!user.value && !isGuestRoute) {
    const redirect = to.fullPath
    return navigateTo({ path: '/login', query: { redirect } })
  }
})
