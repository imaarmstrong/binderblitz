interface AuthUser {
  email: string
  role?: string
  emailVerifiedAt?: string | null
  createdAt?: string
}

export function useAuthUser() {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const loading = useState<boolean>('auth:loading', () => false)

  const fetchUser = async () => {
    loading.value = true
    try {
      const { data, error } = await useFetch<AuthUser>('/api/auth/me')
      if (error.value) {
        user.value = null
      } else {
        user.value = data.value || null
      }
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
