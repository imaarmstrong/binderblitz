<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md rounded-xl border border-white/10 bg-white/10 backdrop-blur-md shadow-lg p-8 text-white">
      <h1 class="text-2xl font-semibold mb-6 text-center">Log in</h1>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block mb-1 text-sm font-medium" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>

        <button
          type="submit"
          class="w-full rounded-md bg-white text-black font-semibold py-2 mt-2 hover:bg-white/90 transition-colors disabled:opacity-60"
          :disabled="loading"
        >
          {{ loading ? 'Logging in...' : 'Log in' }}
        </button>
      </form>

      <p v-if="message" class="mt-4 text-sm" :class="error ? 'text-red-300' : 'text-emerald-200'">
        {{ message }}
      </p>

      <p class="mt-6 text-sm text-center text-white/80">
        Need an account?
        <NuxtLink to="/register" class="underline hover:text-white">Sign up</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { fetchUser } = useAuthUser()

const email = ref('')
const password = ref('')
const loading = ref(false)
const message = ref('')
const error = ref(false)

const handleLogin = async () => {
  loading.value = true
  message.value = ''
  error.value = false
  try {
    const { error: fetchError } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })

    if (fetchError.value) {
      message.value = fetchError.value.data?.message || 'Login failed'
      error.value = true
      return
    }

    // Refresh auth state so the header knows we're logged in
    await fetchUser()
    message.value = 'Logged in successfully.'
  } catch (e) {
    message.value = 'Unexpected error during login'
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>
