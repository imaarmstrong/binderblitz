<template>
  <div class="container max-w-md mx-auto p-5 text-white">
    <h1 class="text-2xl font-semibold mb-4">Settings</h1>

    <div v-if="user" class="space-y-4 bg-white/10 border border-white/10 rounded-xl p-4">
      <h2 class="text-lg font-semibold">Change password</h2>
      <form @submit.prevent="handleChangePassword" class="space-y-3">
        <div>
          <label class="block mb-1 text-sm font-medium" for="currentPassword">Current password</label>
          <input
            id="currentPassword"
            v-model="currentPassword"
            type="password"
            required
            class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>
        <div>
          <label class="block mb-1 text-sm font-medium" for="newPassword">New password</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            required
            minlength="8"
            class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
          <p class="mt-1 text-xs text-white/70">At least 8 characters.</p>
        </div>
        <div>
          <label class="block mb-1 text-sm font-medium" for="confirmNewPassword">Confirm new password</label>
          <input
            id="confirmNewPassword"
            v-model="confirmNewPassword"
            type="password"
            required
            minlength="8"
            class="w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
          <p v-if="passwordMismatch" class="mt-1 text-xs text-red-300">New passwords do not match.</p>
        </div>
        <button
          type="submit"
          class="w-full rounded-md bg-white text-black font-semibold py-2 mt-2 hover:bg-white/90 transition-colors disabled:opacity-60"
          :disabled="loading || passwordMismatch"
        >
          {{ loading ? 'Updating...' : 'Update password' }}
        </button>
      </form>

      <p v-if="message" class="text-sm" :class="error ? 'text-red-300' : 'text-emerald-200'">
        {{ message }}
      </p>
    </div>

    <p v-else class="text-white/80">You need to be logged in to change your settings.</p>
  </div>
</template>

<script setup lang="ts">
const { user, fetchUser } = useAuthUser()

const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const loading = ref(false)
const message = ref('')
const error = ref(false)

const passwordMismatch = computed(() => {
  return (
    newPassword.value.length > 0 &&
    confirmNewPassword.value.length > 0 &&
    newPassword.value !== confirmNewPassword.value
  )
})

onMounted(() => {
  if (!user.value) {
    fetchUser()
  }
})

const handleChangePassword = async () => {
  if (passwordMismatch.value) {
    message.value = 'New passwords do not match'
    error.value = true
    return
  }

  loading.value = true
  message.value = ''
  error.value = false

  try {
    const { error: fetchError, data } = await useFetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
    })

    if (fetchError.value) {
      message.value = fetchError.value.data?.message || 'Failed to update password'
      error.value = true
      return
    }

    message.value = (data.value as any)?.message || 'Password updated successfully'
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
  } catch (e) {
    message.value = 'Unexpected error while updating password'
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>
