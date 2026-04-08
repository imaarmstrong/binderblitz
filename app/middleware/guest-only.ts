import { defineNuxtRouteMiddleware } from 'nuxt/app'
import { useAuthUser } from '~/composables/useAuthUser'

export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchUser } = useAuthUser()

  if (!user.value) {
    await fetchUser()
  }

  if (user.value) {
    return navigateTo('/')
  }
})
