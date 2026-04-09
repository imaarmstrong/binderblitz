<template>
  <div class="container max-w-3xl mx-auto p-5 text-white">
    <NuxtLink
      to="/friends"
      class="inline-flex items-center text-xs mb-4 text-white/70 hover:text-white/100"
    >
      ← Back to friends
    </NuxtLink>

    <div v-if="friend" class="space-y-6">
      <section class="bg-white/10 border border-white/10 rounded-xl p-4">
        <h1 class="text-2xl font-semibold mb-1">
          {{ friend.profile.username || friend.profile.email }}
        </h1>
        <p v-if="friend.profile.username" class="text-sm text-white/70">
          {{ friend.profile.email }}
        </p>
        <p v-if="friend.profile.memberSince" class="text-xs text-white/60 mt-1">
          Member since {{ new Date(friend.profile.memberSince).toLocaleDateString() }}
        </p>
        <p v-if="friend.friendship.since" class="text-xs text-white/60 mt-1">
          You have been friends since
          {{ new Date(friend.friendship.since).toLocaleDateString() }}
        </p>
      </section>

      <section class="bg-white/10 border border-white/10 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">Collection progress</h2>
          <p class="text-xs text-white/70">
            {{ totalSets }} sets • {{ totalCardsCollected }} cards collected
          </p>
        </div>

        <p v-if="friend.sets.length === 0" class="text-sm text-white/70">
          This friend is not tracking any sets yet.
        </p>

        <ul v-else class="space-y-3">
          <li
            v-for="set in friend.sets"
            :key="set.setId"
            class="flex items-center justify-between text-sm bg-black/20 rounded-lg px-3 py-2"
          >
            <div class="flex-1 mr-3">
              <p class="font-medium">{{ set.name }}</p>
              <p v-if="set.totalCards" class="text-xs text-white/60 mb-1">
                {{ set.collectedCardCount }} / {{ set.totalCards }} cards collected
              </p>
              <p v-else class="text-xs text-white/60 mb-1">
                {{ set.collectedCardCount }} cards collected
              </p>

              <div
                v-if="set.totalCards && set.totalCards > 0"
                class="h-2 w-full bg-white/10 rounded-full overflow-hidden"
              >
                <div
                  class="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  :style="{ width: `${setProgress(set)}%` }"
                />
              </div>
            </div>
            <NuxtLink
              :to="`/set/${set.setId}`"
              class="text-xs text-emerald-300 hover:text-emerald-200"
            >
              View set
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>

    <p v-else-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>
    <p v-else class="text-sm text-white/70">Loading friend…</p>
  </div>
</template>

<script setup lang="ts">
interface FriendSetSummary {
  setId: string
  name: string
  logo?: string
  totalCards: number | null
  collectedCardCount: number
}

interface FriendDetailResponse {
  profile: {
    id: string
    email: string
    username: string | null
    memberSince: string | null
  }
  friendship: {
    since: string | null
  }
  sets: FriendSetSummary[]
}

const route = useRoute()
const friendId = route.params.id as string

const { data: friend, error } = await useAsyncData<FriendDetailResponse>(
  `friend-${friendId}`,
  () => $fetch<FriendDetailResponse>(`/api/friends/${friendId}`),
)

const errorMessage = computed(() => {
  if (!error.value) return ''
  const errData = (error.value as any).data
  return (errData && errData.message) || 'Unable to load friend profile'
})

const setProgress = (set: FriendSetSummary): number => {
  if (!set.totalCards || set.totalCards <= 0) return 0
  const pct = (set.collectedCardCount / set.totalCards) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

const totalSets = computed(() => (friend.value ? friend.value.sets.length : 0))
const totalCardsCollected = computed(() =>
  friend.value
    ? friend.value.sets.reduce((sum, set) => sum + set.collectedCardCount, 0)
    : 0,
)
</script>
