<template>
  <div class="container max-w-3xl mx-auto p-5 text-white">
    <h1 class="text-2xl font-semibold mb-4">My profile</h1>

    <div v-if="user" class="space-y-4">
      <form
        class="space-y-3 bg-white/10 border border-white/10 rounded-xl p-4"
        @submit.prevent="saveProfile"
      >
        <h2 class="text-lg font-semibold">Profile info</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        <button
          type="submit"
          class="mt-2 w-full rounded-md bg-white text-black font-semibold py-2 hover:bg-white/90 transition-colors disabled:opacity-60"
          :disabled="savingProfile"
        >
          {{ savingProfile ? 'Saving...' : 'Save profile' }}
        </button>
        <p v-if="profileMessage" class="text-xs" :class="profileError ? 'text-red-300' : 'text-emerald-200'">
          {{ profileMessage }}
        </p>
      </form>

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

const firstName = ref('')
const lastName = ref('')
const username = ref('')
const savingProfile = ref(false)
const profileMessage = ref('')
const profileError = ref(false)

const hydrateProfile = () => {
  if (!user.value) return
  firstName.value = user.value.firstName || ''
  lastName.value = user.value.lastName || ''
  username.value = user.value.username || ''
}

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }
  hydrateProfile()
})

const saveProfile = async () => {
  savingProfile.value = true
  profileMessage.value = ''
  profileError.value = false
  try {
    const { error } = await useFetch('/api/auth/profile', {
      method: 'PUT',
      body: {
        firstName: firstName.value,
        lastName: lastName.value,
        username: username.value,
      },
    })

    if (error.value) {
      profileMessage.value = error.value.data?.message || 'Unable to save profile'
      profileError.value = true
      return
    }

    await fetchUser()
    hydrateProfile()
    profileMessage.value = 'Profile updated'
    profileError.value = false
  } catch (e) {
    profileMessage.value = 'Unexpected error while saving profile'
    profileError.value = true
  } finally {
    savingProfile.value = false
  }
}

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
