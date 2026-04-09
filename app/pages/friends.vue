<template>
  <div class="py-8 md:py-10">
    <div class="container max-w-4xl mx-auto px-5 text-white">
      <header class="mb-6 md:mb-8 flex items-center justify-between gap-3">
        <div>
          <p class="text-[11px] uppercase tracking-[0.2em] text-white/60 mb-2">Social</p>
          <h1 class="text-3xl font-semibold">Friends</h1>
        </div>
      </header>

      <!-- When viewing a specific friend, render the nested detail page -->
      <NuxtPage v-if="hasFriendId" />

      <!-- Default friends overview -->
      <section
        v-else
        class="space-y-5"
      >
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5">
          <h2 class="text-lg font-semibold mb-2">Add a friend</h2>
          <form @submit.prevent="sendRequest" class="flex flex-col sm:flex-row gap-3 items-stretch">
            <input
              v-model="friendEmail"
              type="email"
              required
              placeholder="Friend's email"
              class="flex-1 rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <button
              type="submit"
              class="sm:w-40 rounded-md bg-white text-black text-sm font-semibold py-2 hover:bg-white/90 transition-colors disabled:opacity-60"
              :disabled="sending"
            >
              {{ sending ? 'Sending...' : 'Send request' }}
            </button>
          </form>
          <p v-if="requestMessage" class="mt-2 text-sm" :class="requestError ? 'text-red-300' : 'text-emerald-200'">
            {{ requestMessage }}
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div class="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5">
            <h2 class="text-sm font-semibold mb-2 uppercase tracking-[0.16em] text-white/70">Friend requests</h2>
            <p v-if="pending.length === 0" class="text-sm text-white/70">No pending requests.</p>
            <ul v-else class="space-y-2">
              <li
                v-for="req in pending"
                :key="req.id"
                class="flex items-center justify-between text-sm bg-black/30 rounded-xl px-3 py-2"
              >
                <div>
                  <p class="font-medium">{{ req.requesterEmail }}</p>
                  <p v-if="req.createdAt" class="text-xs text-white/60">
                    Requested on {{ new Date(req.createdAt).toLocaleDateString() }}
                  </p>
                </div>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md bg-white text-black text-xs font-semibold hover:bg-white/90 disabled:opacity-60"
                  :disabled="acceptingId === req.id"
                  @click="accept(req.id)"
                >
                  {{ acceptingId === req.id ? 'Accepting...' : 'Accept' }}
                </button>
              </li>
            </ul>
          </div>

          <div class="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5">
            <h2 class="text-sm font-semibold mb-2 uppercase tracking-[0.16em] text-white/70">Your friends</h2>
            <p v-if="friends.length === 0" class="text-sm text-white/70">You have no friends yet.</p>
            <ul v-else class="space-y-2">
              <li
                v-for="f in friends"
                :key="f.id"
                class="text-sm flex items-center justify-between cursor-pointer bg-black/30 hover:bg-black/40 rounded-xl px-3 py-2 transition-colors"
                @click="openFriend(f.friendId)"
              >
                <div>
                  <p class="font-medium">
                    {{ f.friendUsername || f.friendEmail }}
                  </p>
                  <p v-if="f.friendUsername" class="text-xs text-white/70">
                    {{ f.friendEmail }}
                  </p>
                  <p v-if="f.since" class="text-xs text-white/60">
                    Friends since {{ new Date(f.since).toLocaleDateString() }}
                  </p>
                  <p v-if="f.memberSince" class="text-xs text-white/60">
                    Member since {{ new Date(f.memberSince).toLocaleDateString() }}
                  </p>
                  <p class="text-xs text-white/80 mt-1">
                    Tracking {{ f.progress.totalSetsTracked }} sets,
                    {{ f.progress.totalCardsCollected }} cards collected
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FriendItem {
  id: string
  friendId: string
  friendEmail: string
  friendUsername: string | null
  memberSince: string | null
  progress: {
    totalSetsTracked: number
    totalCardsCollected: number
  }
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
const router = useRouter()

const route = useRoute()
const hasFriendId = computed(() => Boolean(route.params.id))

const openFriend = (friendId: string) => {
  if (!friendId) return
  router.push(`/friends/${friendId}`)
}

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
