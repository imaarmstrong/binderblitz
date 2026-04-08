<template>
  <div class="min-h-screen flex items-center justify-center px-4 text-white">
    <div class="w-full max-w-md rounded-xl border border-white/10 bg-white/10 backdrop-blur-md shadow-lg p-8">
      <h1 class="text-2xl font-semibold mb-4 text-center">Upgrade to BinderBlitz Pro</h1>
      <p class="text-sm text-white/80 mb-6 text-center">
        Support development and unlock full collection tracking by subscribing.
      </p>

      <div
        v-if="successMessage"
        class="mb-4 rounded-md border border-emerald-400/60 bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100"
      >
        {{ successMessage }}
      </div>

      <div class="mb-6 text-sm text-white/80" v-if="user">
        <p>
          Logged in as <span class="font-semibold">{{ user.email }}</span>
        </p>
        <p v-if="user.subscriptionActive" class="mt-1 text-emerald-300">
          Your subscription is active (status: {{ user.subscriptionStatus }}).
        </p>
        <p v-else class="mt-1 text-amber-200">
          You don't have an active subscription yet.
        </p>
      </div>

      <button
        type="button"
        class="w-full rounded-md bg-white text-black font-semibold py-2 mt-2 hover:bg-white/90 transition-colors disabled:opacity-60"
        :disabled="loading"
        @click="startCheckout"
      >
        {{ loading ? 'Redirecting to checkout...' : 'Subscribe with Stripe' }}
      </button>

      <p v-if="error" class="mt-4 text-sm text-red-300">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { user, fetchUser } = useAuthUser()

const loading = ref(false)
const error = ref('')
const successMessage = ref('')

onMounted(async () => {
  // After returning from Stripe, refresh user so subscription flags are up to date
  const successFlag = route.query.success
  const canceledFlag = route.query.canceled

  if (successFlag === '1') {
    // Ask the server to sync subscription status directly from Stripe,
    // then refresh the user so header and other UI update.
    try {
      await useFetch('/api/billing/sync', { method: 'POST' })
    } catch (e) {
      // ignore sync errors here; user can retry later
    }

    await fetchUser()

    successMessage.value = 'Your subscription checkout completed successfully. Your account has been updated.'
  } else if (canceledFlag === '1') {
    successMessage.value = 'Checkout was canceled. You can try again anytime.'
    await fetchUser()
  }
})

const startCheckout = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data, error: fetchError } = await useFetch<{ url: string }>(
      '/api/billing/create-checkout-session',
      { method: 'POST' },
    )

    if (fetchError.value) {
      error.value = fetchError.value.data?.message || 'Unable to start checkout'
      loading.value = false
      return
    }

    if (data.value?.url) {
      window.location.href = data.value.url
    } else {
      error.value = 'No checkout URL returned from server'
      loading.value = false
    }
  } catch (e) {
    error.value = 'Unexpected error starting checkout'
    loading.value = false
  }
}
</script>
