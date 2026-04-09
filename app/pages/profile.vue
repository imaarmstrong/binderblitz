<template>
  <div class="py-8 md:py-10">
    <div class="container max-w-4xl mx-auto px-5 text-white">
      <header class="mb-6 md:mb-8 flex items-center justify-between gap-3">
        <div>
          <p class="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-2">Account</p>
          <h1 class="text-3xl font-semibold">My profile</h1>
        </div>
      </header>

      <div v-if="user" class="grid gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
        <form
          class="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5"
          @submit.prevent="saveProfile"
        >
          <h2 class="text-sm font-semibold text-white/70 uppercase tracking-[0.16em] mb-1">Profile info</h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block mb-1 text-xs font-medium" for="firstName">First name</label>
              <input
                id="firstName"
                v-model="firstName"
                type="text"
                class="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
              />
            </div>

            <div>
              <label class="block mb-1 text-xs font-medium" for="lastName">Last name</label>
              <input
                id="lastName"
                v-model="lastName"
                type="text"
                class="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
              />
            </div>
          </div>

          <div>
            <label class="block mb-1 text-xs font-medium" for="username">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <p class="mt-1 text-[11px] text-white/70">Optional; at least 3 characters, shown to friends.</p>
          </div>

          <div class="text-xs text-white/80 space-y-0.5">
            <p><span class="font-medium text-white">Email:</span> {{ user.email }}</p>
            <p><span class="font-medium text-white">Role:</span> {{ user.role || 'user' }}</p>
            <p>
              <span class="font-medium text-white">Email verified:</span>
              {{ user.emailVerifiedAt ? 'Yes' : 'No' }}
            </p>
            <p v-if="user.createdAt">
              <span class="font-medium text-white">Member since:</span>
              {{ new Date(user.createdAt).toLocaleDateString() }}
            </p>
          </div>

          <button
            type="submit"
            class="mt-3 w-full rounded-md bg-white text-black font-semibold py-2 text-sm hover:bg-white/90 transition-colors disabled:opacity-60"
            :disabled="savingProfile"
          >
            {{ savingProfile ? 'Saving...' : 'Save profile' }}
          </button>
          <p v-if="profileMessage" class="text-xs" :class="profileError ? 'text-red-300' : 'text-emerald-200'">
            {{ profileMessage }}
          </p>
        </form>

        <div class="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5">
          <h2 class="text-sm font-semibold text-white/70 uppercase tracking-[0.16em] mb-1">Subscription</h2>
          <p class="text-sm text-white/80">
            Status:
            <span v-if="user.subscriptionActive" class="text-emerald-300 font-medium">Active</span>
            <span v-else class="text-amber-200 font-medium">Not active</span>
            <span v-if="user.subscriptionStatus" class="ml-1 text-white/60">({{ user.subscriptionStatus }})</span>
          </p>
          <button
            type="button"
            class="w-full rounded-md bg-white text-black font-semibold py-2 mt-2 text-sm hover:bg-white/90 transition-colors disabled:opacity-60"
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

      <p v-else class="text-white/80 text-sm">You need to be logged in to view your profile.</p>
    </div>
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
