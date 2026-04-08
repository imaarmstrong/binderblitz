<template>
  <div class="container max-w-3xl mx-auto p-5 text-white">
    <h1 class="text-2xl font-semibold mb-4">Friends</h1>

    <section class="mb-6 bg-white/10 border border-white/10 rounded-xl p-4">
      <h2 class="text-lg font-semibold mb-2">Add a friend</h2>
      <form @submit.prevent="sendRequest" class="flex flex-col sm:flex-row gap-3 items-stretch">
        <input
          v-model="friendEmail"
          type="email"
          required
          placeholder="Friend's email"
          class="flex-1 rounded-md border border-white/20 bg-black/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/60"
        />
        <button
          type="submit"
          class="sm:w-40 rounded-md bg-white text-black font-semibold py-2 hover:bg-white/90 transition-colors disabled:opacity-60"
          :disabled="sending"
        >
          {{ sending ? 'Sending...' : 'Send request' }}
        </button>
      </form>
      <p v-if="requestMessage" class="mt-2 text-sm" :class="requestError ? 'text-red-300' : 'text-emerald-200'">
        {{ requestMessage }}
      </p>
    </section>

    <section class="mb-6 bg-white/10 border border-white/10 rounded-xl p-4">
      <h2 class="text-lg font-semibold mb-2">Friend requests</h2>
      <p v-if="pending.length === 0" class="text-sm text-white/70">No pending requests.</p>
      <ul v-else class="space-y-2">
        <li
          v-for="req in pending"
          :key="req.id"
          class="flex items-center justify-between text-sm"
        >
          <div>
            <p class="font-medium">{{ req.requesterEmail }}</p>
            <p v-if="req.createdAt" class="text-xs text-white/60">
              Requested on {{ new Date(req.createdAt).toLocaleDateString() }}
            </p>
          </div>
          <button
            type="button"
            class="px-3 py-1 rounded-md bg-white text-black text-xs font-semibold hover:bg-white/90 disabled:opacity-60"
            :disabled="acceptingId === req.id"
            @click="accept(req.id)"
          >
            {{ acceptingId === req.id ? 'Accepting...' : 'Accept' }}
          </button>
        </li>
      </ul>
    </section>

    <section class="bg-white/10 border border-white/10 rounded-xl p-4">
      <h2 class="text-lg font-semibold mb-2">Your friends</h2>
      <p v-if="friends.length === 0" class="text-sm text-white/70">You have no friends yet.</p>
      <ul v-else class="space-y-2">
        <li
          v-for="f in friends"
          :key="f.id"
          class="text-sm flex items-center justify-between"
        >
          <div>
            <p class="font-medium">{{ f.friendEmail }}</p>
            <p v-if="f.since" class="text-xs text-white/60">
              Friends since {{ new Date(f.since).toLocaleDateString() }}
            </p>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
interface FriendItem {
  id: string
  friendEmail: string
  since: string | null
}

interface RequestItem {
  id: string
  requesterEmail: string
  createdAt: string | null
}

const friends = useState<FriendItem[]>("friends:list", () => [])
const pending = useState<RequestItem[]>("friends:pending", () => [])

const friendEmail = ref("")
const sending = ref(false)
const requestMessage = ref("")
const requestError = ref(false)
const acceptingId = ref<string | null>(null)

const loadFriends = async () => {
  const { data } = await useFetch<{ items: FriendItem[] }>("/api/friends")
  friends.value = data.value?.items ?? []
}

const loadRequests = async () => {
  const { data } = await useFetch<{ items: RequestItem[] }>("/api/friends/requests")
  pending.value = data.value?.items ?? []
}

onMounted(async () => {
  await Promise.all([loadFriends(), loadRequests()])
})

const sendRequest = async () => {
  sending.value = true
  requestMessage.value = ""
  requestError.value = false
  try {
    const { error } = await useFetch("/api/friends/request", {
      method: "POST",
      body: { email: friendEmail.value },
    })

    if (error.value) {
      requestMessage.value = error.value.data?.message || "Unable to send friend request"
      requestError.value = true
      return
    }

    requestMessage.value = "Friend request sent"
    friendEmail.value = ""
  } catch (e) {
    requestMessage.value = "Unexpected error while sending request"
    requestError.value = true
  } finally {
    sending.value = false
  }
}

const accept = async (id: string) => {
  acceptingId.value = id
  try {
    const { error } = await useFetch("/api/friends/accept", {
      method: "POST",
      body: { friendshipId: id },
    })

    if (error.value) {
      // simple inline error handling; could be improved
      acceptingId.value = null
      return
    }

    await Promise.all([loadFriends(), loadRequests()])
  } finally {
    acceptingId.value = null
  }
}
</script>
