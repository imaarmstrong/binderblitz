<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-8 text-white">
      <h1 class="text-2xl font-semibold mb-2 text-center">Create an account</h1>
      <p class="text-sm text-white/70 mb-6 text-center">Track your cards, share progress with friends, and see your collection's value over time.</p>

      <form v-if="step === 'register'" @submit.prevent="handleRegister" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block mb-1 text-sm font-medium" for="firstName">First name</label>
            <input
              id="firstName"
              v-model="firstName"
              type="text"
              class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>

          <div>
            <label class="block mb-1 text-sm font-medium" for="lastName">Last name</label>
            <input
              id="lastName"
              v-model="lastName"
              type="text"
              class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium" for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
          <p class="mt-1 text-xs text-white/70">Optional; at least 3 characters, shown to friends.</p>
        </div>

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
            minlength="8"
            class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
          <p class="mt-1 text-xs text-white/70">At least 8 characters.</p>
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium" for="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
          <p v-if="passwordMismatch" class="mt-1 text-xs text-red-300">Passwords do not match.</p>
        </div>

        <button
          type="submit"
          class="w-full rounded-md bg-white text-black font-semibold py-2 mt-2 hover:bg-white/90 transition-colors disabled:opacity-60"
          :disabled="loading || passwordMismatch"
        >
          {{ loading ? 'Creating account...' : 'Sign up' }}
        </button>
      </form>

      <form v-else @submit.prevent="handleVerify" class="space-y-4">
        <p class="text-sm text-white/80">
          We sent a 6-digit verification code to
          <span class="font-semibold">{{ email }}</span>.
        </p>

        <div>
          <label class="block mb-1 text-sm font-medium" for="code">Verification code</label>
          <input
            id="code"
            v-model="code"
            type="text"
            required
            maxlength="6"
            class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 tracking-[0.3em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>

        <button
          type="submit"
          class="w-full rounded-md bg-white text-black font-semibold py-2 mt-2 hover:bg-white/90 transition-colors disabled:opacity-60"
          :disabled="loading"
        >
          {{ loading ? 'Verifying...' : 'Verify email' }}
        </button>
      </form>

      <p v-if="message" class="mt-4 text-sm" :class="error ? 'text-red-300' : 'text-emerald-200'">
        {{ message }}
      </p>

      <p class="mt-6 text-sm text-center text-white/80">
        Already have an account?
        <NuxtLink to="/login" class="underline hover:text-white">Log in</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest-only',
})

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const code = ref('')
const loading = ref(false)
const message = ref('')
const error = ref(false)
const step = ref<'register' | 'verify'>('register')
const firstName = ref('')
const lastName = ref('')
const username = ref('')

const passwordMismatch = computed(() => {
  return password.value.length > 0 && confirmPassword.value.length > 0 && password.value !== confirmPassword.value
})

const handleRegister = async () => {
  if (passwordMismatch.value) {
    message.value = 'Passwords do not match'
    error.value = true
    return
  }

  loading.value = true
  message.value = ''
  error.value = false
  try {
    const { data, error: fetchError } = await useFetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        firstName: firstName.value,
        lastName: lastName.value,
        username: username.value,
      },
    })

    if (fetchError.value) {
      message.value = fetchError.value.data?.message || 'Registration failed'
      error.value = true
      return
    }

    step.value = 'verify'
    message.value = data.value?.message || 'Registration successful. Enter your verification code.'

    if (process.dev && data.value?.code) {
      // Helpful during local dev; you can see the code in the UI.
      message.value += ` (Code: ${data.value.code})`
    }
  } catch (e) {
    message.value = 'Unexpected error during registration'
    error.value = true
  } finally {
    loading.value = false
  }
}

const handleVerify = async () => {
  loading.value = true
  message.value = ''
  error.value = false
  try {
    const { data, error: fetchError } = await useFetch('/api/auth/verify-email', {
      method: 'POST',
      body: { email: email.value, code: code.value },
    })

    if (fetchError.value) {
      message.value = fetchError.value.data?.message || 'Verification failed'
      error.value = true
      return
    }

    message.value = data.value?.message || 'Email verified successfully. You can now log in.'
  } catch (e) {
    message.value = 'Unexpected error during verification'
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>
