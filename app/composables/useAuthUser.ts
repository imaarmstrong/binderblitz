import { $fetch } from 'ofetch'

interface AuthUser {
  email: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  role?: string
  emailVerifiedAt?: string | null
  createdAt?: string
  subscriptionStatus?: string | null
  subscriptionCurrentPeriodEnd?: string | null
  subscriptionActive?: boolean
}

export function useAuthUser() {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const loading = useState<boolean>('auth:loading', () => false)

  const fetchUser = async () => {
    loading.value = true
    try {
      const data = await $fetch<AuthUser>('/api/auth/me')
      user.value = data || null
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    await useFetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/')
  }

  return { user, loading, fetchUser, logout }
}
