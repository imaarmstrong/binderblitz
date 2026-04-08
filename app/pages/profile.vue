<template>
  <div class="container max-w-3xl mx-auto p-5 text-white">
    <h1 class="text-2xl font-semibold mb-4">My profile</h1>

    <div v-if="user" class="space-y-4">
      <div class="space-y-2 bg-white/10 border border-white/10 rounded-xl p-4">
        <p><span class="font-medium">Email:</span> {{ user.email }}</p>
        <p><span class="font-medium">Role:</span> {{ user.role || 'user' }}</p>
        <p>
          <span class="font-medium">Email verified:</span>
          {{ user.emailVerifiedAt ? 'Yes' : 'No' }}
        </p>
        <p v-if="user.createdAt">
          <span class="font-medium">Member since:</span>
          {{ new Date(user.createdAt).toLocaleDateString() }}
        </p>
      </div>

      <div class="space-y-2 bg-white/10 border border-white/10 rounded-xl p-4">
        <h2 class="text-lg font-semibold">Subscription</h2>
        <p class="text-sm text-white/80">
          Status:
          <span v-if="user.subscriptionActive" class="text-emerald-300 font-medium">Active</span>
          <span v-else class="text-amber-200 font-medium">Not active</span>
          <span v-if="user.subscriptionStatus" class="ml-1 text-white/60">({{ user.subscriptionStatus }})</span>
        </p>
        <button
          type="button"
          class="w-full rounded-md bg-white text-black font-semibold py-2 mt-2 hover:bg-white/90 transition-colors disabled:opacity-60"
          :disabled="portalLoading || !user.subscriptionActive"
          @click="openPortal"
        >
          {{ portalLoading ? 'Opening billing portal...' : 'Manage subscription' }}
        </button>
        <p v-if="!user.subscriptionActive" class="text-xs text-white/70">
          You don't have an active subscription yet. Use the Upgrade button in the header to subscribe.
        </p>
        <p v-if="portalError" class="text-xs text-red-300">
          {{ portalError }}
        </p>
      </div>
    </div>

    <p v-else class="text-white/80">You need to be logged in to view your profile.</p>
  </div>
</template>

<script setup lang="ts">
const { user, fetchUser } = useAuthUser()

const portalLoading = ref(false)
const portalError = ref('')

onMounted(() => {
  if (!user.value) {
    fetchUser()
  }
})

const openPortal = async () => {
  portalLoading.value = true
  portalError.value = ''
  try {
    const { data, error: fetchError } = await useFetch<{ url: string }>(
      '/api/billing/portal',
      { method: 'POST' },
    )

    if (fetchError.value) {
      portalError.value = fetchError.value.data?.message || 'Unable to open billing portal'
      portalLoading.value = false
      return
    }

    if (data.value?.url) {
      window.location.href = data.value.url
    } else {
      portalError.value = 'No portal URL returned from server'
      portalLoading.value = false
    }
  } catch (e) {
    portalError.value = 'Unexpected error while opening billing portal'
    portalLoading.value = false
  }
}
</script>
